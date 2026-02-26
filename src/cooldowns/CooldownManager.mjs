import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

/**
 * CooldownManager — Per-user, per-command (or any key) cooldown tracking.
 *
 * Supports multiple scopes: user, guild, channel, global.
 * Everything is in-memory by default; swap the store for Redis-compatible usage.
 *
 * @example
 * import { CooldownManager } from 'djs-forge/cooldowns';
 *
 * const cooldowns = new CooldownManager();
 *
 * client.on('interactionCreate', async (interaction) => {
 *   if (!interaction.isChatInputCommand()) return;
 *
 *   const result = cooldowns.check('ban', interaction.user.id, 10_000);
 *
 *   if (result.onCooldown) {
 *     return interaction.reply({
 *       content: `⏳ Wait **${result.remainingText}** before using this again.`,
 *       ephemeral: true,
 *     });
 *   }
 *
 *   cooldowns.set('ban', interaction.user.id, 10_000);
 *   // ... run command
 * });
 */
export class CooldownManager {
  /**
   * @param {CooldownManagerOptions} [options]
   */
  constructor(options = {}) {
    /** @type {Map<string, number>}  key → expiry timestamp */
    this._store  = options.store ?? new Map();
    this._prefix = options.keyPrefix ?? 'forge:cd:';

    // Auto-sweep expired entries every minute to prevent memory leaks
    if (options.autoSweep !== false) {
      this._sweepInterval = setInterval(() => this.sweep(), 60_000);
      if (this._sweepInterval.unref) this._sweepInterval.unref();
    }
  }

  // ─── Core API ──────────────────────────────────────────────────────────────

  /**
   * Check if a key is on cooldown WITHOUT setting a new entry.
   * @param {string} command   Command / bucket name
   * @param {string} entityId  User ID, guild ID, etc.
   * @param {number} [duration] Not needed for pure checks; used to compute remaining
   * @returns {CooldownResult}
   */
  check(command, entityId, duration) {
    const key    = this._key(command, entityId);
    const expiry = this._get(key);
    const now    = Date.now();

    if (!expiry || now >= expiry) {
      return { onCooldown: false, remaining: 0, remainingText: '0s' };
    }

    const remaining = expiry - now;
    return { onCooldown: true, remaining, remainingText: formatMs(remaining), expiry };
  }

  /**
   * Set a cooldown for a key (overwrites existing).
   * @param {string} command
   * @param {string} entityId
   * @param {number} durationMs  Duration in milliseconds
   * @returns {number}  Expiry timestamp
   */
  set(command, entityId, durationMs) {
    if (durationMs <= 0) throw new ForgeError(ForgeErrorCode.COOLDOWN_INVALID_DURATION);
    const expiry = Date.now() + durationMs;
    this._set(this._key(command, entityId), expiry);
    return expiry;
  }

  /**
   * Check AND set in one call. Throws ForgeError if on cooldown.
   * Great for fire-and-forget usage in command handlers.
   * @param {string} command
   * @param {string} entityId
   * @param {number} durationMs
   * @throws {ForgeError} COOLDOWN_ACTIVE if on cooldown
   */
  use(command, entityId, durationMs) {
    const result = this.check(command, entityId, durationMs);
    if (result.onCooldown) {
      throw new ForgeError(
        ForgeErrorCode.COOLDOWN_ACTIVE,
        `${result.remainingText} remaining`
      );
    }
    this.set(command, entityId, durationMs);
  }

  /**
   * Reset (remove) a cooldown entry early.
   * @param {string} command
   * @param {string} entityId
   */
  reset(command, entityId) {
    this._delete(this._key(command, entityId));
  }

  /**
   * Reset ALL entries for a given command.
   * @param {string} command
   */
  resetAll(command) {
    const prefix = `${this._prefix}${command}:`;
    for (const key of this._keys()) {
      if (key.startsWith(prefix)) this._delete(key);
    }
  }

  /**
   * Get remaining cooldown for a key (0 if not on cooldown).
   * @param {string} command
   * @param {string} entityId
   * @returns {number}  ms remaining
   */
  remaining(command, entityId) {
    return this.check(command, entityId).remaining;
  }

  /**
   * Sweep expired entries from the store.
   * Called automatically every minute; call manually if you need it sooner.
   * @returns {number}  Number of entries removed
   */
  sweep() {
    const now     = Date.now();
    let   removed = 0;
    for (const [key, expiry] of this._entries()) {
      if (now >= expiry) { this._delete(key); removed++; }
    }
    return removed;
  }

  /**
   * Destroy the manager and stop the auto-sweep timer.
   */
  destroy() {
    clearInterval(this._sweepInterval);
    this._store.clear?.();
  }

  // ─── Convenience Scopes ────────────────────────────────────────────────────

  /**
   * Scope helpers — these just standardise the entityId format.
   *
   * @example
   * cooldowns.scope.user('ban', interaction, 10_000)  // per user
   * cooldowns.scope.guild('ban', interaction, 30_000) // per guild
   */
  get scope() {
    return {
      user: (command, interaction, duration) =>
        this.use(command, `user_${interaction.user.id}`, duration),

      guild: (command, interaction, duration) =>
        this.use(command, `guild_${interaction.guildId ?? 'dm'}`, duration),

      channel: (command, interaction, duration) =>
        this.use(command, `channel_${interaction.channelId}`, duration),

      global: (command, _interaction, duration) =>
        this.use(command, 'global', duration),
    };
  }

  // ─── Store Abstraction (override for Redis) ────────────────────────────────

  _key(command, entityId) { return `${this._prefix}${command}:${entityId}`; }
  _get(key)              { return this._store.get(key); }
  _set(key, value)       { this._store.set(key, value); }
  _delete(key)           { this._store.delete(key); }
  _keys()                { return this._store.keys(); }
  _entries()             { return this._store.entries(); }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMs(ms) {
  if (ms < 1_000)    return `${ms}ms`;
  if (ms < 60_000)   return `${(ms / 1_000).toFixed(1)}s`;
  if (ms < 3_600_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * @typedef {object} CooldownResult
 * @property {boolean} onCooldown
 * @property {number}  remaining     ms remaining (0 if not on cooldown)
 * @property {string}  remainingText Human-readable remaining time
 * @property {number}  [expiry]      Expiry timestamp if on cooldown
 */

/**
 * @typedef {object} CooldownManagerOptions
 * @property {Map<string,number>} [store]      Custom store (Map-compatible)
 * @property {string}             [keyPrefix]  Prefix for all keys
 * @property {boolean}            [autoSweep]  Auto-sweep expired entries (default: true)
 */
