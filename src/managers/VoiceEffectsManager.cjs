'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');

/**
 * Manages Discord Voice Effects API — not available in discord.js.
 * Lets users apply real-time audio effects inside voice channels.
 */
class VoiceEffectsManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  /**
   * List the voice effects available for the client user.
   * Requires the bot to be in a voice channel.
   * @param {string} channelId
   */
  async listEffects(channelId) {
    return this._rest.request('GET', `/channels/${channelId}/voice-effects`);
  }

  /**
   * Set a voice effect on the bot's current voice session.
   * Pass null to clear all effects.
   * @param {string} channelId
   * @param {{ effectId?: string|null, animationType?: number, animationId?: number, sessionId?: string }} options
   */
  async setEffect(channelId, options) {
    return this._rest.request('PUT', `/channels/${channelId}/voice-effects`, {
      body: {
        effect_id:      options.effectId ?? null,
        animation_type: options.animationType ?? undefined,
        animation_id:   options.animationId   ?? undefined,
        session_id:     options.sessionId     ?? undefined,
      },
    });
  }
}

module.exports = { VoiceEffectsManager };
