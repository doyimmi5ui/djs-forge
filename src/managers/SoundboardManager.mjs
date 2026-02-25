import { CordXRest } from '../rest/CordXRest.mjs';
import { CordXError, CordXErrorCode } from '../errors/CordXError.mjs';

export class SoundboardManager {
  constructor(client) {
    this._rest = new CordXRest(client);
  }

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
    if (!options.name || !options.sound) throw new CordXError(CordXErrorCode.INVALID_FORM_BODY, 'name and sound are required');
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1)) throw new CordXError(CordXErrorCode.SOUNDBOARD_INVALID_VOLUME);

    return this._rest.request('POST', `/guilds/${guildId}/soundboard-sounds`, {
      reason,
      body: {
        name: options.name,
        sound: options.sound,
        volume: options.volume ?? 1,
        emoji_id: options.emojiId ?? null,
        emoji_name: options.emojiName ?? null,
      },
    });
  }

  async editSound(guildId, soundId, options, reason) {
    if (options.volume !== undefined && (options.volume < 0 || options.volume > 1)) throw new CordXError(CordXErrorCode.SOUNDBOARD_INVALID_VOLUME);

    return this._rest.request('PATCH', `/guilds/${guildId}/soundboard-sounds/${soundId}`, {
      reason,
      body: { name: options.name, volume: options.volume, emoji_id: options.emojiId, emoji_name: options.emojiName },
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
