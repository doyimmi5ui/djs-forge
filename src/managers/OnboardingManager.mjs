import { CordXRest } from '../rest/CordXRest.mjs';

export class OnboardingManager {
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  async get(guildId) {
    return this._rest.request('GET', `/guilds/${guildId}/onboarding`);
  }

  async edit(guildId, options, reason) {
    const body = {};
    if (options.prompts           !== undefined) body.prompts             = options.prompts;
    if (options.defaultChannelIds !== undefined) body.default_channel_ids = options.defaultChannelIds;
    if (options.enabled           !== undefined) body.enabled             = options.enabled;
    if (options.mode              !== undefined) body.mode                = options.mode;

    return this._rest.request('PUT', `/guilds/${guildId}/onboarding`, { body, reason });
  }
}
