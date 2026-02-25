'use strict';

// ─── Error Codes ────────────────────────────────────────────────────────────
const CordXErrorCode = Object.freeze({
  // HTTP / REST
  RATE_LIMITED:              'RATE_LIMITED',
  UNKNOWN_INTERACTION:       'UNKNOWN_INTERACTION',
  UNKNOWN_CHANNEL:           'UNKNOWN_CHANNEL',
  MISSING_PERMISSIONS:       'MISSING_PERMISSIONS',
  MISSING_ACCESS:            'MISSING_ACCESS',
  INVALID_FORM_BODY:         'INVALID_FORM_BODY',
  MAX_REACTIONS_REACHED:     'MAX_REACTIONS_REACHED',

  // Soundboard (not in discord.js)
  SOUNDBOARD_NOT_FOUND:      'SOUNDBOARD_NOT_FOUND',
  SOUNDBOARD_INVALID_VOLUME: 'SOUNDBOARD_INVALID_VOLUME',
  SOUNDBOARD_FILE_TOO_LARGE: 'SOUNDBOARD_FILE_TOO_LARGE',
  SOUNDBOARD_LIMIT_REACHED:  'SOUNDBOARD_LIMIT_REACHED',

  // Polls (not in discord.js)
  POLL_ALREADY_EXPIRED:      'POLL_ALREADY_EXPIRED',
  POLL_NOT_FOUND:            'POLL_NOT_FOUND',
  POLL_INVALID_DURATION:     'POLL_INVALID_DURATION',
  POLL_TOO_MANY_ANSWERS:     'POLL_TOO_MANY_ANSWERS',

  // Monetization / Entitlements (not in discord.js)
  ENTITLEMENT_NOT_FOUND:     'ENTITLEMENT_NOT_FOUND',
  SKU_NOT_FOUND:             'SKU_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND:    'SUBSCRIPTION_NOT_FOUND',

  // Onboarding (not in discord.js)
  ONBOARDING_INVALID_CONFIG: 'ONBOARDING_INVALID_CONFIG',

  // Voice (not in discord.js)
  VOICE_EFFECT_NOT_IN_CHANNEL: 'VOICE_EFFECT_NOT_IN_CHANNEL',

  // General
  CLIENT_NOT_READY:          'CLIENT_NOT_READY',
  INVALID_TOKEN:             'INVALID_TOKEN',
  UNKNOWN:                   'UNKNOWN',
});

const ERROR_MESSAGES = {
  [CordXErrorCode.RATE_LIMITED]:              'You are being rate limited. Please wait before retrying.',
  [CordXErrorCode.UNKNOWN_INTERACTION]:       'The interaction token is invalid or expired (15 min limit).',
  [CordXErrorCode.UNKNOWN_CHANNEL]:           'Channel does not exist or the bot has no access.',
  [CordXErrorCode.MISSING_PERMISSIONS]:       'Bot is missing required permissions for this action.',
  [CordXErrorCode.MISSING_ACCESS]:            'Bot cannot access this resource.',
  [CordXErrorCode.INVALID_FORM_BODY]:         'Request body is invalid. Check your parameters.',
  [CordXErrorCode.MAX_REACTIONS_REACHED]:     'Maximum unique reactions per message reached (20).',
  [CordXErrorCode.SOUNDBOARD_NOT_FOUND]:      'Soundboard sound not found.',
  [CordXErrorCode.SOUNDBOARD_INVALID_VOLUME]: 'Volume must be between 0 and 1.',
  [CordXErrorCode.SOUNDBOARD_FILE_TOO_LARGE]: 'Sound file exceeds the 512 KB limit.',
  [CordXErrorCode.SOUNDBOARD_LIMIT_REACHED]:  'Guild soundboard limit reached.',
  [CordXErrorCode.POLL_ALREADY_EXPIRED]:      'This poll has already expired.',
  [CordXErrorCode.POLL_NOT_FOUND]:            'Poll not found on this message.',
  [CordXErrorCode.POLL_INVALID_DURATION]:     'Poll duration must be between 1 and 168 hours.',
  [CordXErrorCode.POLL_TOO_MANY_ANSWERS]:     'Poll can have at most 10 answer options.',
  [CordXErrorCode.ENTITLEMENT_NOT_FOUND]:     'Entitlement not found for this user/guild.',
  [CordXErrorCode.SKU_NOT_FOUND]:             'SKU not found for this application.',
  [CordXErrorCode.SUBSCRIPTION_NOT_FOUND]:    'Subscription not found.',
  [CordXErrorCode.ONBOARDING_INVALID_CONFIG]: 'Invalid onboarding config. At least one channel must be set.',
  [CordXErrorCode.VOICE_EFFECT_NOT_IN_CHANNEL]: 'User is not in a voice channel.',
  [CordXErrorCode.CLIENT_NOT_READY]:          'CordX client is not ready. Wait for the ready event.',
  [CordXErrorCode.INVALID_TOKEN]:             'Bot token is invalid or has been reset.',
  [CordXErrorCode.UNKNOWN]:                   'An unknown error occurred.',
};

// ─── CordXError Class ────────────────────────────────────────────────────────
class CordXError extends Error {
  /**
   * @param {string} code - One of CordXErrorCode
   * @param {string} [extra] - Extra context message
   * @param {number} [httpStatus] - HTTP status code
   * @param {number} [discordCode] - Discord API error code
   */
  constructor(code, extra, httpStatus, discordCode) {
    const base = ERROR_MESSAGES[code] ?? 'Unknown error.';
    super(extra ? `[CordX/${code}] ${base} — ${extra}` : `[CordX/${code}] ${base}`);
    this.name        = 'CordXError';
    this.code        = code;
    this.httpStatus  = httpStatus;
    this.discordCode = discordCode;
  }

  /** Whether this error is safe to retry */
  get retryable() {
    return this.code === CordXErrorCode.RATE_LIMITED;
  }
}

module.exports = { CordXError, CordXErrorCode };
