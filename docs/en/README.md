# CordX — Documentation (English)

> Extension library for **discord.js** that covers missing Discord API features: Soundboard, Polls, Monetization (SKUs / Entitlements / Subscriptions), Onboarding, Voice Effects, and Super Reactions (Burst Reactions).

---

## Installation

```bash
npm install cordx discord.js
# or
yarn add cordx discord.js
# or
pnpm add cordx discord.js
```

---

## Quick Start

### CommonJS (require)

```js
const { Client, GatewayIntentBits } = require('discord.js');
const { CordX } = require('cordx');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cordx  = new CordX(client);

client.once('ready', async () => {
  // Example: list default soundboard sounds
  const sounds = await cordx.soundboard.getDefaultSounds();
  console.log(sounds);
});

client.login('YOUR_BOT_TOKEN');
```

### ESM (import)

```js
import { Client, GatewayIntentBits } from 'discord.js';
import { CordX } from 'cordx';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cordx  = new CordX(client);

client.once('ready', async () => {
  const skus = await cordx.monetization.getSkus();
  console.log(skus);
});

client.login('YOUR_BOT_TOKEN');
```

---

## CordX(client)

The main class. Pass your discord.js `Client` instance.

| Property           | Type                     | Description                          |
|--------------------|--------------------------|--------------------------------------|
| `.soundboard`      | `SoundboardManager`      | Soundboard API                       |
| `.polls`           | `PollManager`            | Polls API                            |
| `.monetization`    | `MonetizationManager`    | SKUs, Entitlements, Subscriptions    |
| `.onboarding`      | `OnboardingManager`      | Guild Onboarding API                 |
| `.voiceEffects`    | `VoiceEffectsManager`    | Voice Effects API                    |
| `.superReactions`  | `SuperReactionsManager`  | Burst / Super Reactions API          |

---

## SoundboardManager

### `getDefaultSounds()`
Returns Discord's built-in default soundboard sounds.

### `getGuildSounds(guildId)`
Returns all custom sounds in a guild.

### `getSound(guildId, soundId)`
Returns a specific sound.

### `createSound(guildId, options, reason?)`
Creates a custom sound. Options:
```js
{
  name: 'my-sound',           // Required. 2–32 chars
  sound: 'data:audio/mp3;base64,...', // Required. Base64 data URI
  volume: 0.8,                // Optional. 0–1 (default 1)
  emojiId: '123456789',       // Optional. Custom emoji ID
  emojiName: '🔥',            // Optional. Unicode emoji
}
```

### `editSound(guildId, soundId, options, reason?)`
Edits name, volume, or emoji of a sound.

### `deleteSound(guildId, soundId, reason?)`
Deletes a sound.

### `sendSound(channelId, soundId, sourceGuildId?)`
Sends a sound to a voice channel. `sourceGuildId` is required for guild sounds.

---

## PollManager

### `create(channelId, options)`
Creates a poll message. Options:
```js
{
  question: 'What is your favorite color?', // Required
  answers: [                                // Required. Max 10
    { text: 'Red', emojiName: '🔴' },
    { text: 'Blue', emojiName: '🔵' },
  ],
  duration: 24,         // Hours. 1–168 (default 24)
  allowMultiselect: false, // Default false
  content: 'Vote now!', // Optional message content
}
```

### `expire(channelId, messageId)`
Immediately ends a poll.

### `getAnswerVoters(channelId, messageId, answerId, query?)`
Gets users who voted for a specific answer.
- `query.after` — Snowflake for pagination
- `query.limit` — Max results (1–100)

---

## MonetizationManager

### `getSkus()`
Lists all SKUs for the application.

### `getEntitlements(query?)`
Lists entitlements. Optional filters:
```js
{
  userId: '123',
  skuIds: ['456', '789'],
  guildId: '111',
  excludeEnded: true,
  before: 'snowflake',
  after: 'snowflake',
  limit: 100,
}
```

### `getEntitlement(entitlementId)`
Gets a single entitlement.

### `createTestEntitlement(skuId, ownerId, ownerType)`
Creates a test entitlement. `ownerType`: `1` = guild, `2` = user.

### `deleteTestEntitlement(entitlementId)`
Deletes a test entitlement.

### `consumeEntitlement(entitlementId)`
Marks a one-time purchase entitlement as consumed.

### `getSkuSubscriptions(skuId, query?)`
Lists subscriptions for a SKU.

### `getSubscription(skuId, subscriptionId)`
Gets a specific subscription.

---

## OnboardingManager

### `get(guildId)`
Gets the onboarding config for a guild.

### `edit(guildId, options, reason?)`
Edits the onboarding config. Options:
```js
{
  prompts: [...],                          // Array of onboarding prompts
  defaultChannelIds: ['channelId'],        // Auto-joined channels
  enabled: true,
  mode: 0,  // 0 = ONBOARDING_DEFAULT, 1 = ONBOARDING_ADVANCED
}
```

---

## VoiceEffectsManager

### `listEffects(channelId)`
Lists available voice effects for the current voice session.

### `setEffect(channelId, options)`
Applies a voice effect. Pass `effectId: null` to clear.
```js
{
  effectId: 'effect_snowflake',
  animationType: 0,
  animationId: 0,
  sessionId: 'voice_session_id',
}
```

---

## SuperReactionsManager

### `getBurstReactors(channelId, messageId, emoji, query?)`
Gets users who added a burst (super) reaction.

### `deleteBurstReaction(channelId, messageId, emoji)`
Deletes all burst reactions for a given emoji.

### `getReactionSummary(channelId, messageId)`
Returns all reaction counts (normal + burst) for a message.

---

## Error Handling

```js
const { CordXError, CordXErrorCode } = require('cordx');

try {
  await cordx.polls.create(channelId, { question: 'Hi', answers: [], duration: 200 });
} catch (err) {
  if (err instanceof CordXError) {
    console.log(err.code);       // e.g. 'POLL_INVALID_DURATION'
    console.log(err.message);    // Human-readable message
    console.log(err.httpStatus); // HTTP status code if applicable
    console.log(err.retryable);  // true if safe to retry
  }
}
```

### Error Codes

| Code                        | Description                                      |
|-----------------------------|--------------------------------------------------|
| `RATE_LIMITED`              | Being rate limited                               |
| `UNKNOWN_INTERACTION`       | Interaction expired (>15 min)                    |
| `UNKNOWN_CHANNEL`           | Channel not found                                |
| `MISSING_PERMISSIONS`       | Bot lacks permissions                            |
| `SOUNDBOARD_INVALID_VOLUME` | Volume out of 0–1 range                          |
| `SOUNDBOARD_LIMIT_REACHED`  | Guild sound limit hit                            |
| `POLL_ALREADY_EXPIRED`      | Poll is already ended                            |
| `POLL_INVALID_DURATION`     | Duration not between 1–168 hours                 |
| `POLL_TOO_MANY_ANSWERS`     | More than 10 answers                             |
| `ENTITLEMENT_NOT_FOUND`     | Entitlement does not exist                       |
| `SKU_NOT_FOUND`             | SKU not found                                    |
| `SUBSCRIPTION_NOT_FOUND`    | Subscription not found                           |
| `ONBOARDING_INVALID_CONFIG` | Invalid onboarding setup                         |
| `CLIENT_NOT_READY`          | Client not logged in yet                         |
