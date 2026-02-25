import { CordXRest } from '../rest/CordXRest.mjs';

export class VoiceEffectsManager {
  constructor(client) {
    this._rest = new CordXRest(client);
  }

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
}
