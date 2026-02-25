'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');

/**
 * Super Reactions (Burst Reactions) — not available in discord.js.
 * Only users with Nitro can add burst reactions, but bots can read them.
 */
class SuperReactionsManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  /**
   * Get users who reacted with a burst (super) reaction.
   * @param {string} channelId
   * @param {string} messageId
   * @param {string} emoji - URL-encoded emoji (e.g. '%E2%9D%A4%EF%B8%8F' or 'customEmoji:123')
   * @param {{ after?: string, limit?: number }} [query]
   */
  async getBurstReactors(channelId, messageId, emoji, query = {}) {
    const params = new URLSearchParams({ type: '1' }); // type 1 = burst
    if (query.after) params.set('after', query.after);
    if (query.limit) params.set('limit', String(query.limit));
    return this._rest.request(
      'GET',
      `/channels/${channelId}/messages/${messageId}/reactions/${emoji}?${params}`,
    );
  }

  /**
   * Delete all burst reactions for a specific emoji on a message.
   * @param {string} channelId
   * @param {string} messageId
   * @param {string} emoji
   */
  async deleteBurstReaction(channelId, messageId, emoji) {
    return this._rest.request(
      'DELETE',
      `/channels/${channelId}/messages/${messageId}/reactions/${emoji}?type=1`,
    );
  }

  /**
   * Get a summary of all reactions (normal + burst) on a message.
   * Returns counts grouped by emoji and type.
   * @param {string} channelId
   * @param {string} messageId
   */
  async getReactionSummary(channelId, messageId) {
    const msg = await this._rest.request('GET', `/channels/${channelId}/messages/${messageId}`);
    return msg?.reactions ?? [];
  }
}

module.exports = { SuperReactionsManager };
