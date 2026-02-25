import { CordXRest } from '../rest/CordXRest.mjs';

export class MonetizationManager {
  constructor(client) {
    this._rest  = new CordXRest(client);
    this._appId = client.application?.id ?? null;
  }

  _appEndpoint(path) {
    if (!this._appId) throw new Error('[CordX] Client application ID is not available yet. Wait for ready.');
    return `/applications/${this._appId}${path}`;
  }

  async getSkus() {
    return this._rest.request('GET', this._appEndpoint('/skus'));
  }

  async getEntitlements(query = {}) {
    const params = new URLSearchParams();
    if (query.userId)       params.set('user_id', query.userId);
    if (query.skuIds)       params.set('sku_ids', query.skuIds.join(','));
    if (query.before)       params.set('before', query.before);
    if (query.after)        params.set('after', query.after);
    if (query.limit)        params.set('limit', String(query.limit));
    if (query.guildId)      params.set('guild_id', query.guildId);
    if (query.excludeEnded) params.set('exclude_ended', 'true');
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', this._appEndpoint(`/entitlements${qs}`));
  }

  async getEntitlement(entitlementId) {
    return this._rest.request('GET', this._appEndpoint(`/entitlements/${entitlementId}`));
  }

  async createTestEntitlement(skuId, ownerId, ownerType) {
    return this._rest.request('POST', this._appEndpoint('/entitlements'), {
      body: { sku_id: skuId, owner_id: ownerId, owner_type: ownerType },
    });
  }

  async deleteTestEntitlement(entitlementId) {
    return this._rest.request('DELETE', this._appEndpoint(`/entitlements/${entitlementId}`));
  }

  async consumeEntitlement(entitlementId) {
    return this._rest.request('POST', this._appEndpoint(`/entitlements/${entitlementId}/consume`));
  }

  async getSkuSubscriptions(skuId, query = {}) {
    const params = new URLSearchParams();
    if (query.before) params.set('before', query.before);
    if (query.after)  params.set('after', query.after);
    if (query.limit)  params.set('limit', String(query.limit));
    if (query.userId) params.set('user_id', query.userId);
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/skus/${skuId}/subscriptions${qs}`);
  }

  async getSubscription(skuId, subscriptionId) {
    return this._rest.request('GET', `/skus/${skuId}/subscriptions/${subscriptionId}`);
  }
}
