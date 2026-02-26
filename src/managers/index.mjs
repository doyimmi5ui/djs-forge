import { ForgeRest } from '../rest/ForgeRest.mjs';
import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

// ─── SoundboardManager ────────────────────────────────────────────────────────

export class SoundboardManager {
  constructor(client) { this._rest = new ForgeRest(client); }

  async getDefaultSounds() {
    return this._rest.request('GET', '/soundboard-default-sounds');
  }

  async getGuildSounds(guildId) {
    const data = await this._rest.request('GET', `/guilds/${guildId}/soundboard-sounds`);
    return data?.items ?? data;
  }

  async getSound(guildId, soundId) {
    return this._rest.request('GET', `/guilds/${guildId}/soundboard-sounds/${soundId}`);
  }

  async createSound(guildId, options, reason) {
    if (!options.name || !options.sound)
      throw new ForgeError(ForgeErrorCode.INVALID_FORM_BODY, 'name and sound are required');
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1))
      throw new ForgeError(ForgeErrorCode.SOUNDBOARD_INVALID_VOLUME);

    return this._rest.request('POST', `/guilds/${guildId}/soundboard-sounds`, {
      reason,
      body: {
        name:       options.name,
        sound:      options.sound,
        volume:     options.volume ?? 1,
        emoji_id:   options.emojiId   ?? null,
        emoji_name: options.emojiName ?? null,
      },
    });
  }

  async editSound(guildId, soundId, options, reason) {
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1))
      throw new ForgeError(ForgeErrorCode.SOUNDBOARD_INVALID_VOLUME);

    return this._rest.request('PATCH', `/guilds/${guildId}/soundboard-sounds/${soundId}`, {
      reason,
      body: {
        name:       options.name,
        volume:     options.volume,
        emoji_id:   options.emojiId,
        emoji_name: options.emojiName,
      },
    });
  }

  async deleteSound(guildId, soundId, reason) {
    return this._rest.request('DELETE', `/guilds/${guildId}/soundboard-sounds/${soundId}`, { reason });
  }

  async sendSound(channelId, soundId, sourceGuildId) {
    return this._rest.request('POST', `/channels/${channelId}/send-soundboard-sound`, {
      body: { sound_id: soundId, source_guild_id: sourceGuildId ?? undefined },
    });
  }
}

// ─── PollManager ─────────────────────────────────────────────────────────────

export class PollManager {
  constructor(client) { this._rest = new ForgeRest(client); }

  async create(channelId, options) {
    const { question, answers, duration = 24, allowMultiselect = false, layoutType = 1, content } = options;

    if (!question)
      throw new ForgeError(ForgeErrorCode.INVALID_FORM_BODY, 'question is required');
    if (!answers?.length)
      throw new ForgeError(ForgeErrorCode.INVALID_FORM_BODY, 'at least one answer is required');
    if (answers.length > 10)
      throw new ForgeError(ForgeErrorCode.POLL_TOO_MANY_ANSWERS);
    if (duration < 1 || duration > 168)
      throw new ForgeError(ForgeErrorCode.POLL_INVALID_DURATION);

    return this._rest.request('POST', `/channels/${channelId}/messages`, {
      body: {
        content: content ?? undefined,
        poll: {
          question: { text: question },
          answers: answers.map(a => ({
            poll_media: {
              text:  a.text,
              emoji: a.emojiId
                ? { id: a.emojiId }
                : a.emojiName
                  ? { name: a.emojiName }
                  : undefined,
            },
          })),
          duration,
          allow_multiselect: allowMultiselect,
          layout_type:       layoutType,
        },
      },
    });
  }

  async expire(channelId, messageId) {
    return this._rest.request('POST', `/channels/${channelId}/polls/${messageId}/expire`);
  }

  async getAnswerVoters(channelId, messageId, answerId, query = {}) {
    const params = new URLSearchParams();
    if (query.after) params.set('after', query.after);
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/channels/${channelId}/polls/${messageId}/answers/${answerId}${qs}`);
  }
}

// ─── MonetizationManager ─────────────────────────────────────────────────────

export class MonetizationManager {
  constructor(client) {
    this._rest  = new ForgeRest(client);
    this._appId = client.application?.id ?? null;
  }

  _appPath(path) {
    if (!this._appId)
      throw new Error('[djs-forge] Application ID not available yet. Wait for ready.');
    return `/applications/${this._appId}${path}`;
  }

  async getSkus() {
    return this._rest.request('GET', this._appPath('/skus'));
  }

  async getEntitlements(query = {}) {
    const params = new URLSearchParams();
    if (query.userId)       params.set('user_id',       query.userId);
    if (query.skuIds)       params.set('sku_ids',        query.skuIds.join(','));
    if (query.before)       params.set('before',         query.before);
    if (query.after)        params.set('after',          query.after);
    if (query.limit)        params.set('limit',          String(query.limit));
    if (query.guildId)      params.set('guild_id',       query.guildId);
    if (query.excludeEnded) params.set('exclude_ended', 'true');
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', this._appPath(`/entitlements${qs}`));
  }

  async getEntitlement(entitlementId) {
    return this._rest.request('GET', this._appPath(`/entitlements/${entitlementId}`));
  }

  async createTestEntitlement(skuId, ownerId, ownerType) {
    return this._rest.request('POST', this._appPath('/entitlements'), {
      body: { sku_id: skuId, owner_id: ownerId, owner_type: ownerType },
    });
  }

  async deleteTestEntitlement(entitlementId) {
    return this._rest.request('DELETE', this._appPath(`/entitlements/${entitlementId}`));
  }

  async consumeEntitlement(entitlementId) {
    return this._rest.request('POST', this._appPath(`/entitlements/${entitlementId}/consume`));
  }

  async getSkuSubscriptions(skuId, query = {}) {
    const params = new URLSearchParams();
    if (query.before) params.set('before',  query.before);
    if (query.after)  params.set('after',   query.after);
    if (query.limit)  params.set('limit',   String(query.limit));
    if (query.userId) params.set('user_id', query.userId);
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/skus/${skuId}/subscriptions${qs}`);
  }

  async getSubscription(skuId, subscriptionId) {
    return this._rest.request('GET', `/skus/${skuId}/subscriptions/${subscriptionId}`);
  }
}

// ─── OnboardingManager ───────────────────────────────────────────────────────

export class OnboardingManager {
  constructor(client) { this._rest = new ForgeRest(client); }

  async get(guildId) {
    return this._rest.request('GET', `/guilds/${guildId}/onboarding`);
  }

  async edit(guildId, options, reason) {
    const body = {};
    if (options.prompts           !== undefined) body.prompts             = options.prompts;
    if (options.defaultChannelIds !== undefined) body.default_channel_ids = options.defaultChannelIds;
    if (options.enabled           !== undefined) body.enabled             = options.enabled;
    if (options.mode              !== undefined) body.mode                = options.mode;
    return this._rest.request('PUT', `/guilds/${guildId}/onboarding`, { body, reason });
  }
}

// ─── VoiceEffectsManager ─────────────────────────────────────────────────────

export class VoiceEffectsManager {
  constructor(client) { this._rest = new ForgeRest(client); }

  async listEffects(channelId) {
    return this._rest.request('GET', `/channels/${channelId}/voice-effects`);
  }

  async setEffect(channelId, options) {
    return this._rest.request('PUT', `/channels/${channelId}/voice-effects`, {
      body: {
        effect_id:      options.effectId      ?? null,
        animation_type: options.animationType ?? undefined,
        animation_id:   options.animationId   ?? undefined,
        session_id:     options.sessionId     ?? undefined,
      },
    });
  }

  async clearEffect(channelId) {
    return this.setEffect(channelId, { effectId: null });
  }
}

// ─── SuperReactionsManager ───────────────────────────────────────────────────

export class SuperReactionsManager {
  constructor(client) { this._rest = new ForgeRest(client); }

  async getBurstReactors(channelId, messageId, emoji, query = {}) {
    const params = new URLSearchParams({ type: '1' });
    if (query.after) params.set('after', query.after);
    if (query.limit) params.set('limit', String(query.limit));
    return this._rest.request('GET', `/channels/${channelId}/messages/${messageId}/reactions/${emoji}?${params}`);
  }

  async deleteBurstReaction(channelId, messageId, emoji) {
    return this._rest.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${emoji}?type=1`);
  }

  async getReactionSummary(channelId, messageId) {
    const msg = await this._rest.request('GET', `/channels/${channelId}/messages/${messageId}`);
    return msg?.reactions ?? [];
  }
}
