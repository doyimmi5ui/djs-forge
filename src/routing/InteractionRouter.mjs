import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

/**
 * InteractionRouter — Route customIds to handlers without giant if/else chains.
 *
 * Supports exact strings, prefix patterns (with `*` wildcard) and full RegExp.
 * Variables from regex named groups are passed to the handler as params.
 *
 * @example
 * import { InteractionRouter } from 'djs-forge/routing';
 *
 * const router = new InteractionRouter();
 *
 * // Exact match
 * router.on('open_ticket', async (interaction) => { ... });
 *
 * // Prefix wildcard  →  "page_*"  matches  "page_1", "page_next", ...
 * router.on('page_*', async (interaction, { wildcard }) => {
 *   console.log(wildcard); // "1" | "next" | ...
 * });
 *
 * // Named-group regex  →  extract dynamic IDs cleanly
 * router.on(/^ban_(?<userId>\d+)$/, async (interaction, { userId }) => {
 *   await interaction.guild.members.ban(userId);
 * });
 *
 * // Attach to your client
 * client.on('interactionCreate', (i) => router.handle(i));
 */
export class InteractionRouter {
  constructor() {
    /** @type {Array<{ pattern: string|RegExp, compiled: RegExp, handler: Function, once: boolean }>} */
    this._routes  = [];
    this._fallback = null;
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a handler for a customId pattern.
   * @param {string|RegExp} pattern  Exact string, glob ("page_*"), or RegExp
   * @param {Function}      handler  (interaction, params) => void
   * @returns {this}
   */
  on(pattern, handler) {
    this._register(pattern, handler, false);
    return this;
  }

  /**
   * Register a one-time handler that unregisters itself after the first match.
   * @param {string|RegExp} pattern
   * @param {Function}      handler
   * @returns {this}
   */
  once(pattern, handler) {
    this._register(pattern, handler, true);
    return this;
  }

  /**
   * Register a fallback that fires when no route matches.
   * @param {Function} handler  (interaction) => void
   * @returns {this}
   */
  fallback(handler) {
    this._fallback = handler;
    return this;
  }

  /**
   * Remove all handlers for a given pattern (strict equality).
   * @param {string|RegExp} pattern
   * @returns {this}
   */
  off(pattern) {
    this._routes = this._routes.filter(r => r.pattern !== pattern);
    return this;
  }

  // ─── Routing ───────────────────────────────────────────────────────────────

  /**
   * Handle an incoming interaction. Pass this to client.on('interactionCreate').
   * Only processes component / modal interactions (those with a customId).
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>}  true if a handler was found, false otherwise
   */
  async handle(interaction) {
    if (!interaction.customId) return false;

    const customId = interaction.customId;

    for (let i = 0; i < this._routes.length; i++) {
      const route = this._routes[i];
      const match = customId.match(route.compiled);
      if (!match) continue;

      const params = match.groups ?? {};
      if (match[1] !== undefined && !params.wildcard) params.wildcard = match[1];

      if (route.once) this._routes.splice(i, 1);

      await route.handler(interaction, params);
      return true;
    }

    if (this._fallback) {
      await this._fallback(interaction);
      return false;
    }

    return false;
  }

  /**
   * Shorthand: attach the router directly to a discord.js Client.
   * @param {import('discord.js').Client} client
   * @returns {this}
   */
  attach(client) {
    client.on('interactionCreate', (i) => this.handle(i));
    return this;
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  _register(pattern, handler, once) {
    if (typeof handler !== 'function') {
      throw new ForgeError(ForgeErrorCode.ROUTER_INVALID_PATTERN, 'Handler must be a function');
    }

    let compiled;

    if (pattern instanceof RegExp) {
      compiled = pattern;
    } else if (typeof pattern === 'string') {
      if (pattern.includes('*')) {
        // Convert glob  "prefix_*_suffix"  →  /^prefix_(.+)_suffix$/
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.+)');
        compiled = new RegExp(`^${escaped}$`);
      } else {
        // Exact match
        compiled = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}$`);
      }
    } else {
      throw new ForgeError(
        ForgeErrorCode.ROUTER_INVALID_PATTERN,
        'Pattern must be a string or RegExp'
      );
    }

    this._routes.push({ pattern, compiled, handler, once });
  }
}
