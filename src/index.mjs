export { SoundboardManager }     from './managers/SoundboardManager.mjs';
export { PollManager }           from './managers/PollManager.mjs';
export { MonetizationManager }   from './managers/MonetizationManager.mjs';
export { OnboardingManager }     from './managers/OnboardingManager.mjs';
export { VoiceEffectsManager }   from './managers/VoiceEffectsManager.mjs';
export { SuperReactionsManager } from './managers/SuperReactionsManager.mjs';
export { CordXError, CordXErrorCode } from './errors/CordXError.mjs';

import { SoundboardManager }     from './managers/SoundboardManager.mjs';
import { PollManager }           from './managers/PollManager.mjs';
import { MonetizationManager }   from './managers/MonetizationManager.mjs';
import { OnboardingManager }     from './managers/OnboardingManager.mjs';
import { VoiceEffectsManager }   from './managers/VoiceEffectsManager.mjs';
import { SuperReactionsManager } from './managers/SuperReactionsManager.mjs';
import { CordXError, CordXErrorCode } from './errors/CordXError.mjs';

/**
 * CordX — Extension library for discord.js
 *
 * @example
 * // ESM
 * import { Client, GatewayIntentBits } from 'discord.js';
 * import { CordX } from 'cordx';
 *
 * const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 * const cordx  = new CordX(client);
 *
 * client.once('ready', async () => {
 *   const skus = await cordx.monetization.getSkus();
 *   console.log(skus);
 * });
 *
 * client.login('YOUR_TOKEN');
 */
export class CordX {
  constructor(client) {
    if (!client) throw new CordXError(CordXErrorCode.CLIENT_NOT_READY, 'Pass your discord.js Client to CordX constructor');

    this.soundboard     = new SoundboardManager(client);
    this.polls          = new PollManager(client);
    this.monetization   = new MonetizationManager(client);
    this.onboarding     = new OnboardingManager(client);
    this.voiceEffects   = new VoiceEffectsManager(client);
    this.superReactions = new SuperReactionsManager(client);
  }
}
