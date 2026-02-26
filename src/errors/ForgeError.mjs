// ─── Error Codes ─────────────────────────────────────────────────────────────
export const ForgeErrorCode = Object.freeze({
  // REST / HTTP
  RATE_LIMITED:                'RATE_LIMITED',
  UNKNOWN:                     'UNKNOWN',
  INVALID_TOKEN:               'INVALID_TOKEN',
  CLIENT_NOT_READY:            'CLIENT_NOT_READY',

  // Discord API
  UNKNOWN_INTERACTION:         'UNKNOWN_INTERACTION',
  UNKNOWN_CHANNEL:             'UNKNOWN_CHANNEL',
  UNKNOWN_GUILD:               'UNKNOWN_GUILD',
  UNKNOWN_MESSAGE:             'UNKNOWN_MESSAGE',
  UNKNOWN_WEBHOOK:             'UNKNOWN_WEBHOOK',
  MISSING_PERMISSIONS:         'MISSING_PERMISSIONS',
  MISSING_ACCESS:              'MISSING_ACCESS',
  INVALID_FORM_BODY:           'INVALID_FORM_BODY',

  // Reactions
  MAX_REACTIONS_REACHED:       'MAX_REACTIONS_REACHED',

  // Soundboard
  SOUNDBOARD_NOT_FOUND:        'SOUNDBOARD_NOT_FOUND',
  SOUNDBOARD_INVALID_VOLUME:   'SOUNDBOARD_INVALID_VOLUME',
  SOUNDBOARD_FILE_TOO_LARGE:   'SOUNDBOARD_FILE_TOO_LARGE',
  SOUNDBOARD_LIMIT_REACHED:    'SOUNDBOARD_LIMIT_REACHED',

  // Polls
  POLL_ALREADY_EXPIRED:        'POLL_ALREADY_EXPIRED',
  POLL_NOT_FOUND:              'POLL_NOT_FOUND',
  POLL_INVALID_DURATION:       'POLL_INVALID_DURATION',
  POLL_TOO_MANY_ANSWERS:       'POLL_TOO_MANY_ANSWERS',

  // Monetization
  ENTITLEMENT_NOT_FOUND:       'ENTITLEMENT_NOT_FOUND',
  SKU_NOT_FOUND:               'SKU_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND:      'SUBSCRIPTION_NOT_FOUND',

  // Onboarding
  ONBOARDING_INVALID_CONFIG:   'ONBOARDING_INVALID_CONFIG',

  // Voice
  VOICE_EFFECT_NOT_IN_CHANNEL: 'VOICE_EFFECT_NOT_IN_CHANNEL',

  // Webhooks
  WEBHOOK_INVALID_URL:         'WEBHOOK_INVALID_URL',
  WEBHOOK_NOT_FOUND:           'WEBHOOK_NOT_FOUND',

  // Interaction Router
  ROUTER_HANDLER_NOT_FOUND:    'ROUTER_HANDLER_NOT_FOUND',
  ROUTER_INVALID_PATTERN:      'ROUTER_INVALID_PATTERN',

  // Paginator
  PAGINATOR_NO_PAGES:          'PAGINATOR_NO_PAGES',
  PAGINATOR_INVALID_PAGE:      'PAGINATOR_INVALID_PAGE',

  // Cooldowns
  COOLDOWN_ACTIVE:             'COOLDOWN_ACTIVE',
  COOLDOWN_INVALID_DURATION:   'COOLDOWN_INVALID_DURATION',

  // Confirmations
  CONFIRMATION_TIMED_OUT:      'CONFIRMATION_TIMED_OUT',
  CONFIRMATION_CANCELLED:      'CONFIRMATION_CANCELLED',
});

const ERROR_MESSAGES = {
  [ForgeErrorCode.RATE_LIMITED]:                'You are being rate limited. Please wait before retrying.',
  [ForgeErrorCode.UNKNOWN]:                     'An unknown error occurred.',
  [ForgeErrorCode.INVALID_TOKEN]:               'Bot token is invalid or has been reset.',
  [ForgeErrorCode.CLIENT_NOT_READY]:            'djs-forge is not ready. Wait for the ready event.',

  [ForgeErrorCode.UNKNOWN_INTERACTION]:         'The interaction token is invalid or expired (15-minute limit).',
  [ForgeErrorCode.UNKNOWN_CHANNEL]:             'Channel does not exist or the bot has no access.',
  [ForgeErrorCode.UNKNOWN_GUILD]:               'Guild not found or bot is not a member.',
  [ForgeErrorCode.UNKNOWN_MESSAGE]:             'Message not found.',
  [ForgeErrorCode.UNKNOWN_WEBHOOK]:             'Webhook not found.',
  [ForgeErrorCode.MISSING_PERMISSIONS]:         'Bot is missing required permissions for this action.',
  [ForgeErrorCode.MISSING_ACCESS]:              'Bot cannot access this resource.',
  [ForgeErrorCode.INVALID_FORM_BODY]:           'Request body is invalid. Check your parameters.',

  [ForgeErrorCode.MAX_REACTIONS_REACHED]:       'Maximum unique reactions per message reached (20).',

  [ForgeErrorCode.SOUNDBOARD_NOT_FOUND]:        'Soundboard sound not found.',
  [ForgeErrorCode.SOUNDBOARD_INVALID_VOLUME]:   'Volume must be between 0 and 1.',
  [ForgeErrorCode.SOUNDBOARD_FILE_TOO_LARGE]:   'Sound file exceeds the 512 KB limit.',
  [ForgeErrorCode.SOUNDBOARD_LIMIT_REACHED]:    'Guild soundboard limit reached.',

  [ForgeErrorCode.POLL_ALREADY_EXPIRED]:        'This poll has already expired.',
  [ForgeErrorCode.POLL_NOT_FOUND]:              'Poll not found on this message.',
  [ForgeErrorCode.POLL_INVALID_DURATION]:       'Poll duration must be between 1 and 168 hours.',
  [ForgeErrorCode.POLL_TOO_MANY_ANSWERS]:       'Poll can have at most 10 answer options.',

  [ForgeErrorCode.ENTITLEMENT_NOT_FOUND]:       'Entitlement not found for this user/guild.',
  [ForgeErrorCode.SKU_NOT_FOUND]:               'SKU not found for this application.',
  [ForgeErrorCode.SUBSCRIPTION_NOT_FOUND]:      'Subscription not found.',

  [ForgeErrorCode.ONBOARDING_INVALID_CONFIG]:   'Invalid onboarding config. At least one channel must be set.',
  [ForgeErrorCode.VOICE_EFFECT_NOT_IN_CHANNEL]: 'User is not in a voice channel.',

  [ForgeErrorCode.WEBHOOK_INVALID_URL]:         'Invalid Discord webhook URL format.',
  [ForgeErrorCode.WEBHOOK_NOT_FOUND]:           'Webhook not found or was deleted.',

  [ForgeErrorCode.ROUTER_HANDLER_NOT_FOUND]:    'No handler registered for this customId.',
  [ForgeErrorCode.ROUTER_INVALID_PATTERN]:      'Invalid customId pattern. Patterns must be strings or RegExp.',

  [ForgeErrorCode.PAGINATOR_NO_PAGES]:          'Paginator requires at least one page.',
  [ForgeErrorCode.PAGINATOR_INVALID_PAGE]:      'Page index out of bounds.',

  [ForgeErrorCode.COOLDOWN_ACTIVE]:             'This command is on cooldown.',
  [ForgeErrorCode.COOLDOWN_INVALID_DURATION]:   'Cooldown duration must be greater than 0.',

  [ForgeErrorCode.CONFIRMATION_TIMED_OUT]:      'Confirmation timed out. No response received.',
  [ForgeErrorCode.CONFIRMATION_CANCELLED]:      'User cancelled the confirmation.',
};

export class ForgeError extends Error {
  /**
   * @param {keyof typeof ForgeErrorCode} code
   * @param {string} [extra]
   * @param {number} [httpStatus]
   * @param {number} [discordCode]
   */
  constructor(code, extra, httpStatus, discordCode) {
    const base = ERROR_MESSAGES[code] ?? 'Unknown error.';
    super(extra ? `[djs-forge/${code}] ${base} — ${extra}` : `[djs-forge/${code}] ${base}`);
    this.name        = 'ForgeError';
    this.code        = code;
    this.httpStatus  = httpStatus  ?? null;
    this.discordCode = discordCode ?? null;
  }

  get retryable() {
    return this.code === ForgeErrorCode.RATE_LIMITED;
  }

  toJSON() {
    return {
      name:        this.name,
      code:        this.code,
      message:     this.message,
      httpStatus:  this.httpStatus,
      discordCode: this.discordCode,
    };
  }
}
