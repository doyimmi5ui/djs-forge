'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');

class MonetizationManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
    this._appId = client.application?.id ?? null;
  }

  _appEndpoint(path) {
    if (!this._appId) throw new Error('[CordX] Client application ID is not available yet. Wait for ready.');
    return `/applications/${this._appId}${path}`;
  }

  // ─── SKUs ──────────────────────────────────────────────────────────────────

  /**
   * List all SKUs for the application.
   */
  async getSkus() {
    return this._rest.request('GET', this._appEndpoint('/skus'));
  }

  // ─── Entitlements ─────────────────────────────────────────────────────────

  /**
   * List entitlements.
   * @param {{ userId?: string, skuIds?: string[], before?: string, after?: string, limit?: number, guildId?: string, excludeEnded?: boolean }} [query]
   */
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

  /**
   * Get a single entitlement.
   * @param {string} entitlementId
   */
  async getEntitlement(entitlementId) {
    return this._rest.request('GET', this._appEndpoint(`/entitlements/${entitlementId}`));
  }

  /**
   * Create a test entitlement (only works in dev/test mode).
   * @param {string} skuId
   * @param {string} ownerId - Guild ID or User ID
   * @param {1|2} ownerType - 1 = guild, 2 = user
   */
  async createTestEntitlement(skuId, ownerId, ownerType) {
    return this._rest.request('POST', this._appEndpoint('/entitlements'), {
      body: { sku_id: skuId, owner_id: ownerId, owner_type: ownerType },
    });
  }

  /**
   * Delete a test entitlement.
   * @param {string} entitlementId
   */
  async deleteTestEntitlement(entitlementId) {
    return this._rest.request('DELETE', this._appEndpoint(`/entitlements/${entitlementId}`));
  }

  /**
   * Mark an entitlement as consumed (one-time purchases).
   * @param {string} entitlementId
   */
  async consumeEntitlement(entitlementId) {
    return this._rest.request('POST', this._appEndpoint(`/entitlements/${entitlementId}/consume`));
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  /**
   * List subscriptions for a SKU.
   * @param {string} skuId
   * @param {{ before?: string, after?: string, limit?: number, userId?: string }} [query]
   */
  async getSkuSubscriptions(skuId, query = {}) {
    const params = new URLSearchParams();
    if (query.before)  params.set('before', query.before);
    if (query.after)   params.set('after', query.after);
    if (query.limit)   params.set('limit', String(query.limit));
    if (query.userId)  params.set('user_id', query.userId);
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/skus/${skuId}/subscriptions${qs}`);
  }

  /**
   * Get a specific subscription.
   * @param {string} skuId
   * @param {string} subscriptionId
   */
  async getSubscription(skuId, subscriptionId) {
    return this._rest.request('GET', `/skus/${skuId}/subscriptions/${subscriptionId}`);
  }
}

module.exports = { MonetizationManager };
