'use strict';

const { SoundboardManager }     = require('./managers/SoundboardManager.cjs');
const { PollManager }           = require('./managers/PollManager.cjs');
const { MonetizationManager }   = require('./managers/MonetizationManager.cjs');
const { OnboardingManager }     = require('./managers/OnboardingManager.cjs');
const { VoiceEffectsManager }   = require('./managers/VoiceEffectsManager.cjs');
const { SuperReactionsManager } = require('./managers/SuperReactionsManager.cjs');
const { CordXError, CordXErrorCode } = require('./errors/CordXError.cjs');

/**
 * CordX — Extension library for discord.js
 * Attach to your existing discord.js Client to unlock missing Discord API features.
 *
 * @example
 * // CommonJS
 * const { Client, GatewayIntentBits } = require('discord.js');
 * const { CordX } = require('cordx');
 *
 * const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 * const cordx  = new CordX(client);
 *
 * client.once('ready', async () => {
 *   const sounds = await cordx.soundboard.getDefaultSounds();
 *   console.log(sounds);
 * });
 *
 * client.login('YOUR_TOKEN');
 */
class CordX {
  /**
   * @param {import('discord.js').Client} client - Your discord.js client (must be logged in or ready)
   */
  constructor(client) {
    if (!client) throw new CordXError(CordXErrorCode.CLIENT_NOT_READY, 'Pass your discord.js Client to CordX constructor');

    /** @type {SoundboardManager} */
    this.soundboard = new SoundboardManager(client);

    /** @type {PollManager} */
    this.polls = new PollManager(client);

    /** @type {MonetizationManager} */
    this.monetization = new MonetizationManager(client);

    /** @type {OnboardingManager} */
    this.onboarding = new OnboardingManager(client);

    /** @type {VoiceEffectsManager} */
    this.voiceEffects = new VoiceEffectsManager(client);

    /** @type {SuperReactionsManager} */
    this.superReactions = new SuperReactionsManager(client);
  }
}

module.exports = {
  CordX,
  CordXError,
  CordXErrorCode,
  SoundboardManager,
  PollManager,
  MonetizationManager,
  OnboardingManager,
  VoiceEffectsManager,
  SuperReactionsManager,
};
