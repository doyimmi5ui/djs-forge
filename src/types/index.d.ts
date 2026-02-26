import {
  Client,
  RepliableInteraction,
  TextBasedChannel,
  ButtonStyle,
  EmbedBuilder,
  BaseInteraction,
} from 'discord.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export const ForgeErrorCode: {
  readonly RATE_LIMITED: 'RATE_LIMITED';
  readonly UNKNOWN: 'UNKNOWN';
  readonly INVALID_TOKEN: 'INVALID_TOKEN';
  readonly CLIENT_NOT_READY: 'CLIENT_NOT_READY';
  readonly UNKNOWN_INTERACTION: 'UNKNOWN_INTERACTION';
  readonly UNKNOWN_CHANNEL: 'UNKNOWN_CHANNEL';
  readonly UNKNOWN_GUILD: 'UNKNOWN_GUILD';
  readonly UNKNOWN_MESSAGE: 'UNKNOWN_MESSAGE';
  readonly UNKNOWN_WEBHOOK: 'UNKNOWN_WEBHOOK';
  readonly MISSING_PERMISSIONS: 'MISSING_PERMISSIONS';
  readonly MISSING_ACCESS: 'MISSING_ACCESS';
  readonly INVALID_FORM_BODY: 'INVALID_FORM_BODY';
  readonly MAX_REACTIONS_REACHED: 'MAX_REACTIONS_REACHED';
  readonly SOUNDBOARD_NOT_FOUND: 'SOUNDBOARD_NOT_FOUND';
  readonly SOUNDBOARD_INVALID_VOLUME: 'SOUNDBOARD_INVALID_VOLUME';
  readonly SOUNDBOARD_FILE_TOO_LARGE: 'SOUNDBOARD_FILE_TOO_LARGE';
  readonly SOUNDBOARD_LIMIT_REACHED: 'SOUNDBOARD_LIMIT_REACHED';
  readonly POLL_ALREADY_EXPIRED: 'POLL_ALREADY_EXPIRED';
  readonly POLL_NOT_FOUND: 'POLL_NOT_FOUND';
  readonly POLL_INVALID_DURATION: 'POLL_INVALID_DURATION';
  readonly POLL_TOO_MANY_ANSWERS: 'POLL_TOO_MANY_ANSWERS';
  readonly ENTITLEMENT_NOT_FOUND: 'ENTITLEMENT_NOT_FOUND';
  readonly SKU_NOT_FOUND: 'SKU_NOT_FOUND';
  readonly SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND';
  readonly ONBOARDING_INVALID_CONFIG: 'ONBOARDING_INVALID_CONFIG';
  readonly VOICE_EFFECT_NOT_IN_CHANNEL: 'VOICE_EFFECT_NOT_IN_CHANNEL';
  readonly WEBHOOK_INVALID_URL: 'WEBHOOK_INVALID_URL';
  readonly WEBHOOK_NOT_FOUND: 'WEBHOOK_NOT_FOUND';
  readonly ROUTER_HANDLER_NOT_FOUND: 'ROUTER_HANDLER_NOT_FOUND';
  readonly ROUTER_INVALID_PATTERN: 'ROUTER_INVALID_PATTERN';
  readonly PAGINATOR_NO_PAGES: 'PAGINATOR_NO_PAGES';
  readonly PAGINATOR_INVALID_PAGE: 'PAGINATOR_INVALID_PAGE';
  readonly COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE';
  readonly COOLDOWN_INVALID_DURATION: 'COOLDOWN_INVALID_DURATION';
  readonly CONFIRMATION_TIMED_OUT: 'CONFIRMATION_TIMED_OUT';
  readonly CONFIRMATION_CANCELLED: 'CONFIRMATION_CANCELLED';
};

export type ForgeErrorCodeType = keyof typeof ForgeErrorCode;

export class ForgeError extends Error {
  readonly code: ForgeErrorCodeType;
  readonly httpStatus: number | null;
  readonly discordCode: number | null;
  readonly retryable: boolean;
  constructor(code: ForgeErrorCodeType, extra?: string, httpStatus?: number, discordCode?: number);
  toJSON(): { name: string; code: string; message: string; httpStatus: number | null; discordCode: number | null };
}

// ─── InteractionRouter ────────────────────────────────────────────────────────

type RouteHandler<P = Record<string, string>> = (interaction: RepliableInteraction, params: P) => Promise<void> | void;

export class InteractionRouter {
  on(pattern: string | RegExp, handler: RouteHandler): this;
  once(pattern: string | RegExp, handler: RouteHandler): this;
  off(pattern: string | RegExp): this;
  fallback(handler: (interaction: RepliableInteraction) => void): this;
  handle(interaction: RepliableInteraction): Promise<boolean>;
  attach(client: Client): this;
}

// ─── Paginator ────────────────────────────────────────────────────────────────

export interface PaginatorLabels {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
  stop?: string;
}

export interface PaginatorOptions {
  startPage?: number;
  timeout?: number;
  showPageCount?: boolean;
  showStop?: boolean;
  ephemeral?: boolean;
  userId?: string;
  labels?: PaginatorLabels;
}

export class Paginator {
  constructor(pages: object[], options?: PaginatorOptions);
  reply(interaction: RepliableInteraction): Promise<void>;
  send(channel: TextBasedChannel, userId?: string): Promise<void>;
  goTo(index: number): Promise<void>;
  stop(): Promise<void>;
}

// ─── CooldownManager ─────────────────────────────────────────────────────────

export interface CooldownResult {
  onCooldown: boolean;
  remaining: number;
  remainingText: string;
  expiry?: number;
}

export interface CooldownManagerOptions {
  store?: Map<string, number>;
  keyPrefix?: string;
  autoSweep?: boolean;
}

export class CooldownManager {
  constructor(options?: CooldownManagerOptions);
  check(command: string, entityId: string, duration?: number): CooldownResult;
  set(command: string, entityId: string, durationMs: number): number;
  use(command: string, entityId: string, durationMs: number): void;
  reset(command: string, entityId: string): void;
  resetAll(command: string): void;
  remaining(command: string, entityId: string): number;
  sweep(): number;
  destroy(): void;
  readonly scope: {
    user(command: string, interaction: RepliableInteraction, duration: number): void;
    guild(command: string, interaction: RepliableInteraction, duration: number): void;
    channel(command: string, interaction: RepliableInteraction, duration: number): void;
    global(command: string, interaction: RepliableInteraction, duration: number): void;
  };
}

// ─── ConfirmationManager ─────────────────────────────────────────────────────

export interface ConfirmationDefaults {
  timeout?: number;
  ephemeral?: boolean;
  confirmLabel?: string;
  confirmStyle?: ButtonStyle;
  cancelLabel?: string;
  cancelStyle?: ButtonStyle;
  confirmedText?: string;
  cancelledText?: string;
  timedOutText?: string;
  updateReply?: boolean;
}

export interface ConfirmationAskOptions extends ConfirmationDefaults {
  content?: string;
  embeds?: object[];
  components?: object[];
}

export class ConfirmationManager {
  constructor(defaults?: ConfirmationDefaults);
  ask(interaction: RepliableInteraction, options?: ConfirmationAskOptions): Promise<boolean>;
}

// ─── WebhookManager ───────────────────────────────────────────────────────────

export interface WebhookSendOptions {
  content?: string;
  username?: string;
  avatarUrl?: string;
  embeds?: object[];
  components?: object[];
  tts?: boolean;
}

export interface WebhookSendMeta {
  threadId?: string;
  wait?: boolean;
}

export class WebhookManager {
  constructor(client: Client);
  send(url: string, payload: WebhookSendOptions, meta?: WebhookSendMeta): Promise<object | null>;
  sendBatch(url: string, payload: WebhookSendOptions, meta?: WebhookSendMeta): Promise<object[]>;
  edit(url: string, messageId: string, payload: WebhookSendOptions, threadId?: string): Promise<object>;
  delete(url: string, messageId: string, threadId?: string): Promise<null>;
  fetch(url: string): Promise<object>;
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export const EmbedPresets: {
  success(title: string, description?: string, extra?: object): EmbedBuilder;
  error(title: string, description?: string, extra?: object): EmbedBuilder;
  warning(title: string, description?: string, extra?: object): EmbedBuilder;
  info(title: string, description?: string, extra?: object): EmbedBuilder;
  loading(title?: string, description?: string, extra?: object): EmbedBuilder;
  blank(color?: number): EmbedBuilder;
};

export const Timestamp: {
  relative(date: Date | number | string): string;
  time(date: Date | number | string): string;
  timeLong(date: Date | number | string): string;
  date(date: Date | number | string): string;
  dateLong(date: Date | number | string): string;
  full(date: Date | number | string): string;
  fullLong(date: Date | number | string): string;
  unix(date: Date | number | string): number;
};

export const Perms: {
  botHas(interaction: BaseInteraction, permissions: string[]): boolean;
  memberHas(interaction: BaseInteraction, permissions: string[]): boolean;
  missingText(interaction: BaseInteraction, permissions: string[]): string;
};

export const Strings: {
  truncate(text: string, max: number, suffix?: string): string;
  codeblock(code: string, lang?: string): string;
  chunk(text: string, maxLength?: number): string[];
  plural(count: number, singular: string, plural?: string): string;
  escapeMarkdown(text: string): string;
  formatNumber(n: number, locale?: string): string;
};

export const Mention: {
  user(id: string): string;
  channel(id: string): string;
  role(id: string): string;
  command(name: string, id: string): string;
  emoji(name: string, id: string, animated?: boolean): string;
};

// ─── DjsForge (all-in-one) ────────────────────────────────────────────────────

export class DjsForge {
  readonly soundboard:     SoundboardManager;
  readonly polls:          PollManager;
  readonly monetization:   MonetizationManager;
  readonly onboarding:     OnboardingManager;
  readonly voiceEffects:   VoiceEffectsManager;
  readonly superReactions: SuperReactionsManager;
  readonly router:         InteractionRouter;
  readonly cooldowns:      CooldownManager;
  readonly confirmations:  ConfirmationManager;
  readonly webhooks:       WebhookManager;
  constructor(client: Client);
  paginator(pages: object[], options?: PaginatorOptions): Paginator;
}

// ─── Managers ────────────────────────────────────────────────────────────────

export declare class SoundboardManager {
  constructor(client: Client);
  getDefaultSounds(): Promise<object[]>;
  getGuildSounds(guildId: string): Promise<object[]>;
  getSound(guildId: string, soundId: string): Promise<object>;
  createSound(guildId: string, options: object, reason?: string): Promise<object>;
  editSound(guildId: string, soundId: string, options: object, reason?: string): Promise<object>;
  deleteSound(guildId: string, soundId: string, reason?: string): Promise<null>;
  sendSound(channelId: string, soundId: string, sourceGuildId?: string): Promise<null>;
}

export declare class PollManager {
  constructor(client: Client);
  create(channelId: string, options: object): Promise<object>;
  expire(channelId: string, messageId: string): Promise<null>;
  getAnswerVoters(channelId: string, messageId: string, answerId: number, query?: object): Promise<object>;
}

export declare class MonetizationManager {
  constructor(client: Client);
  getSkus(): Promise<object[]>;
  getEntitlements(query?: object): Promise<object[]>;
  getEntitlement(entitlementId: string): Promise<object>;
  createTestEntitlement(skuId: string, ownerId: string, ownerType: number): Promise<object>;
  deleteTestEntitlement(entitlementId: string): Promise<null>;
  consumeEntitlement(entitlementId: string): Promise<null>;
  getSkuSubscriptions(skuId: string, query?: object): Promise<object[]>;
  getSubscription(skuId: string, subscriptionId: string): Promise<object>;
}

export declare class OnboardingManager {
  constructor(client: Client);
  get(guildId: string): Promise<object>;
  edit(guildId: string, options: object, reason?: string): Promise<object>;
}

export declare class VoiceEffectsManager {
  constructor(client: Client);
  listEffects(channelId: string): Promise<object[]>;
  setEffect(channelId: string, options: object): Promise<null>;
  clearEffect(channelId: string): Promise<null>;
}

export declare class SuperReactionsManager {
  constructor(client: Client);
  getBurstReactors(channelId: string, messageId: string, emoji: string, query?: object): Promise<object[]>;
  deleteBurstReaction(channelId: string, messageId: string, emoji: string): Promise<null>;
  getReactionSummary(channelId: string, messageId: string): Promise<object[]>;
}
