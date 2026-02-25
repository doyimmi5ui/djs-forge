'use strict';

const { CordXError, CordXErrorCode } = require('./errors/CordXError.cjs');

const DISCORD_API = 'https://discord.com/api/v10';

// Discord API error code → CordX code mapping
const DISCORD_CODE_MAP = {
  10062: CordXErrorCode.UNKNOWN_INTERACTION,
  10003: CordXErrorCode.UNKNOWN_CHANNEL,
  50013: CordXErrorCode.MISSING_PERMISSIONS,
  50001: CordXErrorCode.MISSING_ACCESS,
  50035: CordXErrorCode.INVALID_FORM_BODY,
  10084: CordXErrorCode.ENTITLEMENT_NOT_FOUND,
  10082: CordXErrorCode.SKU_NOT_FOUND,
};

class CordXRest {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    const token = client?.token;
    if (!token) throw new CordXError(CordXErrorCode.CLIENT_NOT_READY);
    this._token = token;
  }

  /**
   * Make a raw request to the Discord API.
   * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
   * @param {string} endpoint - e.g. '/guilds/123/soundboard-sounds'
   * @param {{ body?: object, reason?: string }} [options]
   * @returns {Promise<any>}
   */
  async request(method, endpoint, options = {}) {
    const url = `${DISCORD_API}${endpoint}`;

    const headers = {
      Authorization: `Bot ${this._token}`,
    };

    if (options.reason) {
      headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
    }

    let body;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const res = await fetch(url, { method, headers, body });

    if (res.status === 204) return null;

    const data = await res.json();

    if (!res.ok) {
      this._handleError(res.status, data);
    }

    return data;
  }

  _handleError(status, data) {
    const discordCode = data?.code ?? 0;
    const message     = data?.message ?? '';

    if (status === 429) {
      throw new CordXError(
        CordXErrorCode.RATE_LIMITED,
        `Retry-After: ${data?.retry_after}s`,
        status, discordCode,
      );
    }

    const mapped = DISCORD_CODE_MAP[discordCode];
    if (mapped) throw new CordXError(mapped, message, status, discordCode);

    throw new CordXError(CordXErrorCode.UNKNOWN, `HTTP ${status}: ${message}`, status, discordCode);
  }
}

module.exports = { CordXRest };
