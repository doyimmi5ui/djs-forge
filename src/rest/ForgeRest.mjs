import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

const DISCORD_API = 'https://discord.com/api/v10';

const DISCORD_CODE_MAP = {
  10062: ForgeErrorCode.UNKNOWN_INTERACTION,
  10003: ForgeErrorCode.UNKNOWN_CHANNEL,
  10004: ForgeErrorCode.UNKNOWN_GUILD,
  10008: ForgeErrorCode.UNKNOWN_MESSAGE,
  10015: ForgeErrorCode.UNKNOWN_WEBHOOK,
  50013: ForgeErrorCode.MISSING_PERMISSIONS,
  50001: ForgeErrorCode.MISSING_ACCESS,
  50035: ForgeErrorCode.INVALID_FORM_BODY,
  10084: ForgeErrorCode.ENTITLEMENT_NOT_FOUND,
  10082: ForgeErrorCode.SKU_NOT_FOUND,
};

export class ForgeRest {
  constructor(client) {
    const token = client?.token;
    if (!token) throw new ForgeError(ForgeErrorCode.CLIENT_NOT_READY);
    this._token = token;
  }

  /**
   * Make a raw REST request to the Discord API.
   * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
   * @param {string} endpoint
   * @param {{ body?: any, reason?: string, query?: Record<string,string> }} [options]
   */
  async request(method, endpoint, options = {}) {
    let url = `${DISCORD_API}${endpoint}`;

    if (options.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params}`;
    }

    const headers = { Authorization: `Bot ${this._token}` };

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
    if (!res.ok) this._handleError(res.status, data);
    return data;
  }

  _handleError(status, data) {
    const discordCode = data?.code ?? 0;
    const message     = data?.message ?? '';

    if (status === 429) {
      throw new ForgeError(
        ForgeErrorCode.RATE_LIMITED,
        `Retry-After: ${data?.retry_after}s`,
        status,
        discordCode
      );
    }

    const mapped = DISCORD_CODE_MAP[discordCode];
    if (mapped) throw new ForgeError(mapped, message, status, discordCode);
    throw new ForgeError(ForgeErrorCode.UNKNOWN, `HTTP ${status}: ${message}`, status, discordCode);
  }
}
