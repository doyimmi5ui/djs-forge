import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';
import { ForgeRest } from '../rest/ForgeRest.mjs';

const WEBHOOK_URL_REGEX = /^https:\/\/discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/(\d+)\/([\w-]+)/;

/**
 * WebhookManager — Enhanced webhook utilities on top of discord.js.
 *
 * Supports sending rich messages, thread posting, editing/deleting sent messages,
 * and batching multiple embeds into a single send (Discord's 10-embed limit handled).
 *
 * @example
 * import { WebhookManager } from 'djs-forge/webhooks';
 *
 * const webhooks = new WebhookManager(client);
 *
 * // Send via URL (no need to create a WebhookClient)
 * await webhooks.send('https://discord.com/api/webhooks/...', {
 *   username: 'Logger',
 *   content: 'Hello from djs-forge!',
 * });
 *
 * // Send to a thread
 * await webhooks.send(url, { content: 'Thread message' }, { threadId: '12345' });
 *
 * // Send many embeds auto-batched (no more "maximum 10 embeds" crashes)
 * await webhooks.sendBatch(url, { embeds: lotsOfEmbeds });
 */
export class WebhookManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new ForgeRest(client);
  }

  // ─── Core Send ─────────────────────────────────────────────────────────────

  /**
   * Send a message via webhook URL.
   * @param {string} url
   * @param {WebhookSendOptions} payload
   * @param {WebhookSendMeta} [meta]
   * @returns {Promise<object|null>}
   */
  async send(url, payload, meta = {}) {
    const { id, token } = this._parse(url);
    const qs = new URLSearchParams({ wait: meta.wait !== false ? 'true' : 'false' });
    if (meta.threadId) qs.set('thread_id', meta.threadId);

    return this._rest.request('POST', `/webhooks/${id}/${token}?${qs}`, {
      body: this._normalise(payload),
    });
  }

  /**
   * Auto-batch an array of embeds across multiple sends (max 10 per message).
   * @param {string} url
   * @param {WebhookSendOptions} payload  Must include `embeds`
   * @param {WebhookSendMeta} [meta]
   * @returns {Promise<object[]>}  Array of sent message objects
   */
  async sendBatch(url, payload, meta = {}) {
    const embeds = payload.embeds ?? [];
    const chunks = [];
    for (let i = 0; i < embeds.length; i += 10) chunks.push(embeds.slice(i, i + 10));

    const results = [];
    for (let ci = 0; ci < chunks.length; ci++) {
      const isFirst = ci === 0;
      const msg = await this.send(
        url,
        { ...payload, embeds: chunks[ci], content: isFirst ? payload.content : undefined },
        meta
      );
      results.push(msg);
    }
    return results;
  }

  /**
   * Edit a previously sent webhook message.
   * @param {string} url
   * @param {string} messageId
   * @param {WebhookSendOptions} payload
   * @param {string} [threadId]
   */
  async edit(url, messageId, payload, threadId) {
    const { id, token } = this._parse(url);
    const qs = threadId ? `?thread_id=${threadId}` : '';
    return this._rest.request('PATCH', `/webhooks/${id}/${token}/messages/${messageId}${qs}`, {
      body: this._normalise(payload),
    });
  }

  /**
   * Delete a previously sent webhook message.
   * @param {string} url
   * @param {string} messageId
   * @param {string} [threadId]
   */
  async delete(url, messageId, threadId) {
    const { id, token } = this._parse(url);
    const qs = threadId ? `?thread_id=${threadId}` : '';
    return this._rest.request('DELETE', `/webhooks/${id}/${token}/messages/${messageId}${qs}`);
  }

  /**
   * Fetch info about the webhook itself.
   * @param {string} url
   */
  async fetch(url) {
    const { id, token } = this._parse(url);
    return this._rest.request('GET', `/webhooks/${id}/${token}`);
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  _parse(url) {
    const match = WEBHOOK_URL_REGEX.exec(url);
    if (!match) throw new ForgeError(ForgeErrorCode.WEBHOOK_INVALID_URL, url);
    return { id: match[1], token: match[2] };
  }

  _normalise(payload) {
    const out = { ...payload };
    // discord.js EmbedBuilder → plain JSON
    if (out.embeds) out.embeds = out.embeds.map(e => e.toJSON?.() ?? e);
    if (out.components) out.components = out.components.map(c => c.toJSON?.() ?? c);
    return out;
  }
}

/**
 * @typedef {object} WebhookSendOptions
 * @property {string} [content]
 * @property {string} [username]
 * @property {string} [avatarUrl]
 * @property {Array}  [embeds]
 * @property {Array}  [components]
 * @property {boolean}[tts]
 * @property {Array}  [allowedMentions]
 */

/**
 * @typedef {object} WebhookSendMeta
 * @property {string}  [threadId]    Post into a specific thread
 * @property {boolean} [wait=true]   Wait for Discord to confirm the message
 */
