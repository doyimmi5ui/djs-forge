'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');
const { CordXError, CordXErrorCode } = require('../errors/CordXError.cjs');

class SoundboardManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  /**
   * List all default Discord soundboard sounds.
   * @returns {Promise<object[]>}
   */
  async getDefaultSounds() {
    return this._rest.request('GET', '/soundboard-default-sounds');
  }

  /**
   * List all soundboard sounds in a guild.
   * @param {string} guildId
   * @returns {Promise<object[]>}
   */
  async getGuildSounds(guildId) {
    const data = await this._rest.request('GET', `/guilds/${guildId}/soundboard-sounds`);
    return data?.items ?? data;
  }

  /**
   * Get a specific soundboard sound from a guild.
   * @param {string} guildId
   * @param {string} soundId
   * @returns {Promise<object>}
   */
  async getSound(guildId, soundId) {
    return this._rest.request('GET', `/guilds/${guildId}/soundboard-sounds/${soundId}`);
  }

  /**
   * Create a soundboard sound in a guild.
   * @param {string} guildId
   * @param {{ name: string, sound: string, volume?: number, emojiId?: string, emojiName?: string }} options
   * @param {string} [reason]
   * @returns {Promise<object>}
   */
  async createSound(guildId, options, reason) {
    if (!options.name || !options.sound) {
      throw new CordXError(CordXErrorCode.INVALID_FORM_BODY, 'name and sound are required');
    }
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1)) {
      throw new CordXError(CordXErrorCode.SOUNDBOARD_INVALID_VOLUME);
    }

    return this._rest.request('POST', `/guilds/${guildId}/soundboard-sounds`, {
      reason,
      body: {
        name:       options.name,
        sound:      options.sound,  // base64 data URI
        volume:     options.volume ?? 1,
        emoji_id:   options.emojiId   ?? null,
        emoji_name: options.emojiName ?? null,
      },
    });
  }

  /**
   * Edit a soundboard sound.
   * @param {string} guildId
   * @param {string} soundId
   * @param {{ name?: string, volume?: number, emojiId?: string|null, emojiName?: string|null }} options
   * @param {string} [reason]
   */
  async editSound(guildId, soundId, options, reason) {
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1)) {
      throw new CordXError(CordXErrorCode.SOUNDBOARD_INVALID_VOLUME);
    }

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

  /**
   * Delete a soundboard sound from a guild.
   * @param {string} guildId
   * @param {string} soundId
   * @param {string} [reason]
   */
  async deleteSound(guildId, soundId, reason) {
    return this._rest.request('DELETE', `/guilds/${guildId}/soundboard-sounds/${soundId}`, { reason });
  }

  /**
   * Send a soundboard sound to a voice channel.
   * @param {string} channelId - Voice channel ID
   * @param {string} soundId
   * @param {string} [sourceGuildId] - Required for guild sounds (not for default sounds)
   */
  async sendSound(channelId, soundId, sourceGuildId) {
    return this._rest.request('POST', `/channels/${channelId}/send-soundboard-sound`, {
      body: {
        sound_id:         soundId,
        source_guild_id:  sourceGuildId ?? undefined,
      },
    });
  }
}

module.exports = { SoundboardManager };
