import { CordXRest } from '../rest/CordXRest.mjs';

export class SuperReactionsManager {
  constructor(client) {
    this._rest = new CordXRest(client);
  }

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
