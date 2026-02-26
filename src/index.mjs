// ─── Core ─────────────────────────────────────────────────────────────────────
export { ForgeError, ForgeErrorCode }     from './errors/ForgeError.mjs';
export { ForgeRest }                      from './rest/ForgeRest.mjs';

// ─── Managers (Discord API coverage) ──────────────────────────────────────────
export {
  SoundboardManager,
  PollManager,
  MonetizationManager,
  OnboardingManager,
  VoiceEffectsManager,
  SuperReactionsManager,
} from './managers/index.mjs';

// ─── New Toolkit ───────────────────────────────────────────────────────────────
export { InteractionRouter }   from './routing/InteractionRouter.mjs';
export { Paginator }           from './pagination/Paginator.mjs';
export { CooldownManager }     from './cooldowns/CooldownManager.mjs';
export { ConfirmationManager } from './confirmations/ConfirmationManager.mjs';
export { WebhookManager }      from './webhooks/WebhookManager.mjs';

// ─── Utils ─────────────────────────────────────────────────────────────────────
export {
  EmbedPresets,
  Timestamp,
  Perms,
  Strings,
  Mention,
} from './utils/index.mjs';

// ─── DjsForge (all-in-one facade) ─────────────────────────────────────────────
import { ForgeError, ForgeErrorCode }     from './errors/ForgeError.mjs';
import { SoundboardManager, PollManager, MonetizationManager, OnboardingManager, VoiceEffectsManager, SuperReactionsManager } from './managers/index.mjs';
import { InteractionRouter }   from './routing/InteractionRouter.mjs';
import { CooldownManager }     from './cooldowns/CooldownManager.mjs';
import { ConfirmationManager } from './confirmations/ConfirmationManager.mjs';
import { WebhookManager }      from './webhooks/WebhookManager.mjs';

/**
 * DjsForge — All-in-one facade for all djs-forge features.
 *
 * @example
 * import { Client, GatewayIntentBits } from 'discord.js';
 * import { DjsForge } from 'djs-forge';
 *
 * const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 * const forge  = new DjsForge(client);
 *
 * // Route interactions without if/else hell
 * forge.router.on('open_ticket', async (i) => { ... });
 * forge.router.on(/^ban_(?<userId>\d+)$/, async (i, { userId }) => { ... });
 * forge.router.attach(client);
 *
 * // Paginate with one line
 * await forge.paginator(pages).reply(interaction);
 *
 * // Cooldowns
 * forge.cooldowns.scope.user('ban', interaction, 10_000);
 *
 * // Confirmations
 * const ok = await forge.confirmations.ask(interaction, { content: 'Are you sure?' });
 *
 * client.login('TOKEN');
 */
export class DjsForge {
  constructor(client) {
    if (!client) throw new ForgeError(ForgeErrorCode.CLIENT_NOT_READY, 'Pass your discord.js Client to DjsForge');

    // ── Discord API managers ──
    this.soundboard     = new SoundboardManager(client);
    this.polls          = new PollManager(client);
    this.monetization   = new MonetizationManager(client);
    this.onboarding     = new OnboardingManager(client);
    this.voiceEffects   = new VoiceEffectsManager(client);
    this.superReactions = new SuperReactionsManager(client);

    // ── Toolkit ──
    this.router         = new InteractionRouter();
    this.cooldowns      = new CooldownManager();
    this.confirmations  = new ConfirmationManager();
    this.webhooks       = new WebhookManager(client);
  }

  /**
   * Create a pre-configured Paginator instance.
   * @param {Array} pages
   * @param {object} [options]
   */
  paginator(pages, options) {
    const { Paginator } = require('./pagination/Paginator.mjs');
    return new Paginator(pages, options);
  }
}
