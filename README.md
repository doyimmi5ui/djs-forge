# cordx

> Extension library for **discord.js** — covering missing Discord API features.

[![npm](https://img.shields.io/npm/v/cordx)](https://www.npmjs.com/package/cordx)
[![license](https://img.shields.io/npm/l/cordx)](LICENSE)
[![discord.js](https://img.shields.io/badge/discord.js-%3E%3D14-blue)](https://discord.js.org)

---

**What CordX adds that discord.js doesn't have:**

- 🔊 **Soundboard** — create, edit, delete and send guild sounds
- 📊 **Polls** — full Polls API (create, expire, get voters)
- 💰 **Monetization** — SKUs, Entitlements, Subscriptions
- 🚪 **Onboarding** — read and edit guild onboarding config
- 🎙️ **Voice Effects** — list and apply voice channel effects
- ⚡ **Super Reactions** — burst/super reaction API
- 🛡️ **Better Error Handling** — typed `CordXError` with codes, HTTP status and retryable flag

---

## Install

```bash
npm install cordx discord.js
```

---

## Usage

```js
// CommonJS
const { Client, GatewayIntentBits } = require('discord.js');
const { CordX } = require('cordx');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cordx  = new CordX(client);

client.once('ready', async () => {
  // Soundboard
  const sounds = await cordx.soundboard.getDefaultSounds();

  // Polls
  await cordx.polls.create('CHANNEL_ID', {
    question: 'Tabs or Spaces?',
    answers: [{ text: 'Tabs' }, { text: 'Spaces' }],
    duration: 24,
  });

  // Monetization
  const skus = await cordx.monetization.getSkus();
});

client.login('TOKEN');
```

---

## Documentation

- [English](./docs/en/README.md)
- [Português](./docs/pt/README.md)

---

## License

MIT
