'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');

class OnboardingManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  /**
   * Get the onboarding configuration of a guild.
   * @param {string} guildId
   */
  async get(guildId) {
    return this._rest.request('GET', `/guilds/${guildId}/onboarding`);
  }

  /**
   * Edit the onboarding configuration of a guild.
   * @param {string} guildId
   * @param {{
   *   prompts?: object[],
   *   defaultChannelIds?: string[],
   *   enabled?: boolean,
   *   mode?: 0|1
   * }} options
   * @param {string} [reason]
   */
  async edit(guildId, options, reason) {
    const body = {};
    if (options.prompts          !== undefined) body.prompts            = options.prompts;
    if (options.defaultChannelIds !== undefined) body.default_channel_ids = options.defaultChannelIds;
    if (options.enabled          !== undefined) body.enabled            = options.enabled;
    if (options.mode             !== undefined) body.mode               = options.mode;

    return this._rest.request('PUT', `/guilds/${guildId}/onboarding`, { body, reason });
  }
}

module.exports = { OnboardingManager };
