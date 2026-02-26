# djs-forge 🔨

**The missing toolkit for discord.js** — Interaction routing, pagination, cooldowns, confirmations, embed presets, enhanced webhooks and full Discord API coverage.

[![npm version](https://img.shields.io/npm/v/djs-forge.svg?style=flat)](https://www.npmjs.com/package/djs-forge)
[![discord.js](https://img.shields.io/badge/discord.js-%3E%3D14.0.0-blue)](https://discord.js.org)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Why djs-forge?

discord.js is amazing — but every bot project ends up copy-pasting the same boilerplate:

| Pain point | djs-forge solution |
|---|---|
| Giant `if/else` chains for component `customId`s | `InteractionRouter` with strings, globs and regex |
| Building pagination from scratch every project | `Paginator` — one line to paginate anything |
| Reinventing cooldown handling every time | `CooldownManager` with per-user, guild, channel, global scopes |
| `await confirm()` that works reliably | `ConfirmationManager` |
| Webhook URL sending without a WebhookClient | `WebhookManager` with auto-batching |
| Rebuilding the same success/error embed styles | `EmbedPresets` |
| Forgetting Discord timestamp format codes | `Timestamp.relative(date)`, `.full(date)`, etc. |
| Soundboard / Poll / Monetization APIs not in djs | All covered via sub-managers |

---

## Installation

```sh
npm install djs-forge
# or
yarn add djs-forge
# or
pnpm add djs-forge
```

**Peer dependency:** `discord.js >= 14.0.0`

---

## Quick Start

```js
import { Client, GatewayIntentBits } from 'discord.js';
import { DjsForge, EmbedPresets } from 'djs-forge';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const forge  = new DjsForge(client);

// Route ALL component interactions — no more if/else
forge.router
  .on('open_ticket',            async (i) => { /* ... */ })
  .on('close_ticket',           async (i) => { /* ... */ })
  .on(/^ban_(?<userId>\d+)$/,   async (i, { userId }) => { /* ... */ })
  .on('page_*',                 async (i, { wildcard }) => { /* ... */ })
  .attach(client);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Cooldown: 10s per user
  try {
    forge.cooldowns.scope.user('ping', interaction, 10_000);
  } catch {
    return interaction.reply({ content: '⏳ You are on cooldown!', ephemeral: true });
  }

  // Reply with a preset embed
  await interaction.reply({ embeds: [EmbedPresets.success('Pong!', 'Everything is working.')] });
});

client.login('TOKEN');
```

---

## Sub-path Imports

For tree-shaking and clarity, every feature has its own sub-path:

```js
import { InteractionRouter }   from 'djs-forge/routing';
import { Paginator }           from 'djs-forge/pagination';
import { CooldownManager }     from 'djs-forge/cooldowns';
import { ConfirmationManager } from 'djs-forge/confirmations';
import { WebhookManager }      from 'djs-forge/webhooks';
import { EmbedPresets, Timestamp, Perms, Strings, Mention } from 'djs-forge/utils';
```

---

## InteractionRouter

```js
import { InteractionRouter } from 'djs-forge/routing';

const router = new InteractionRouter();

// Exact match
router.on('open_ticket', async (interaction) => {
  await interaction.reply('Ticket opened!');
});

// Wildcard glob  →  "page_*"  matches  "page_1", "page_next", "page_abc"
router.on('page_*', async (interaction, { wildcard }) => {
  await interaction.reply(`You pressed page ${wildcard}`);
});

// Named-group regex  →  extract dynamic IDs
router.on(/^confirm_delete_(?<itemId>\d+)$/, async (interaction, { itemId }) => {
  await deleteItem(itemId);
  await interaction.reply('Deleted!');
});

// Fallback — fires when nothing matches
router.fallback(async (interaction) => {
  await interaction.reply({ content: 'Unknown action.', ephemeral: true });
});

// Attach to your client (one line)
router.attach(client);
```

---

## Paginator

```js
import { Paginator } from 'djs-forge/pagination';

// Any array of message payloads
const pages = Array.from({ length: 10 }, (_, i) => ({
  embeds: [new EmbedBuilder().setTitle(`Page ${i + 1}`).setDescription(`Content ${i + 1}`)]
}));

const paginator = new Paginator(pages, {
  timeout:       120_000,   // 2 minutes
  showPageCount: true,      // shows "3 / 10" button
  ephemeral:     false,
});

// Reply to a slash command
await paginator.reply(interaction);

// Or send to a channel
await paginator.send(channel, interaction.user.id);
```

---

## CooldownManager

```js
import { CooldownManager } from 'djs-forge/cooldowns';

const cooldowns = new CooldownManager();

// In your command handler:

// Option 1: throw-based (simplest)
try {
  cooldowns.scope.user('ban', interaction, 10_000);   // 10s per user
} catch (err) {
  return interaction.reply({ content: `⏳ ${err.message}`, ephemeral: true });
}

// Option 2: check-then-set
const result = cooldowns.check('ban', interaction.user.id, 10_000);
if (result.onCooldown) {
  return interaction.reply({ content: `⏳ Wait **${result.remainingText}**`, ephemeral: true });
}
cooldowns.set('ban', interaction.user.id, 10_000);

// Scopes: .scope.user | .scope.guild | .scope.channel | .scope.global
```

---

## ConfirmationManager

```js
import { ConfirmationManager } from 'djs-forge/confirmations';

const confirm = new ConfirmationManager({
  confirmLabel: '🗑️ Delete',
  cancelLabel:  'Cancel',
  timeout:      20_000,
});

// In a slash command:
let confirmed;
try {
  confirmed = await confirm.ask(interaction, {
    content: '⚠️ Are you sure you want to **delete all data**? This cannot be undone.',
  });
} catch {
  return; // Timed out — message is already updated
}

if (!confirmed) return; // User clicked Cancel — message is already updated

// Proceed with deletion...
await interaction.editReply({ content: '✅ All data deleted.', components: [] });
```

---

## WebhookManager

```js
import { WebhookManager } from 'djs-forge/webhooks';

const webhooks = new WebhookManager(client);
const url = process.env.LOG_WEBHOOK_URL;

// Send a message
await webhooks.send(url, {
  username: 'Logger',
  content:  `✅ User ${user.tag} was banned.`,
});

// Send to a thread
await webhooks.send(url, { content: 'Thread update' }, { threadId: '1234567890' });

// Auto-batch many embeds (never crashes on the 10-embed limit)
await webhooks.sendBatch(url, { embeds: fiftyEmbeds });

// Edit a sent message
const msg = await webhooks.send(url, { content: 'loading...' });
await webhooks.edit(url, msg.id, { content: 'done!' });
```

---

## Utils

```js
import { EmbedPresets, Timestamp, Perms, Strings, Mention } from 'djs-forge/utils';

// EmbedPresets
interaction.reply({ embeds: [EmbedPresets.success('Done!', 'User was banned.')] });
interaction.reply({ embeds: [EmbedPresets.error('Failed', 'Missing permissions.')] });
interaction.reply({ embeds: [EmbedPresets.warning('Warning', 'This is irreversible.')] });
interaction.reply({ embeds: [EmbedPresets.info('Info', 'Bot version: 2.0.0')] });

// Timestamps (no more Googling the format)
`Joined: ${Timestamp.relative(member.joinedAt)}`    // "3 days ago"
`Created: ${Timestamp.full(guild.createdAt)}`        // "15 January 2025 14:30"
`Expires: ${Timestamp.time(expiryDate)}`             // "14:30"

// Permission checks
if (!Perms.botHas(interaction, ['BanMembers'])) {
  return interaction.reply(Perms.missingText(interaction, ['BanMembers']));
}

// Strings
Strings.truncate(longText, 256)         // "Hello world…"
Strings.codeblock(code, 'js')           // ```js\n...\n```
Strings.chunk(veryLongText, 2000)       // ['chunk1', 'chunk2', ...]
Strings.plural(1, 'apple')              // "apple"
Strings.plural(5, 'apple')              // "apples"

// Mentions
`Welcome ${Mention.user(userId)}!`
`Check ${Mention.channel(channelId)}`
`Use ${Mention.command('ban', commandId)}`
```

---

## Discord API Managers

These cover Discord API endpoints not yet in discord.js:

```js
import { DjsForge } from 'djs-forge';
const forge = new DjsForge(client);

// Soundboard
const sounds = await forge.soundboard.getGuildSounds(guildId);
await forge.soundboard.sendSound(channelId, soundId);

// Polls
const poll = await forge.polls.create(channelId, {
  question: 'Best language?',
  answers: [{ text: 'JavaScript' }, { text: 'TypeScript' }, { text: 'Rust' }],
  duration: 24,
});

// Monetization
const skus = await forge.monetization.getSkus();
const entitlements = await forge.monetization.getEntitlements({ userId: '123' });

// Onboarding
await forge.onboarding.edit(guildId, { enabled: true, mode: 0 });

// Voice Effects
await forge.voiceEffects.setEffect(channelId, { effectId: 'some_effect_id' });
await forge.voiceEffects.clearEffect(channelId);

// Super Reactions
const reactors = await forge.superReactions.getBurstReactors(channelId, messageId, '⚡');
```

---

## CJS Support

```js
// CommonJS
const { DjsForge, EmbedPresets } = require('djs-forge');
const { InteractionRouter }      = require('djs-forge/routing');
const { Paginator }              = require('djs-forge/pagination');
const { CooldownManager }        = require('djs-forge/cooldowns');
const { ConfirmationManager }    = require('djs-forge/confirmations');
```

---

## Error Handling

All errors thrown by djs-forge are `ForgeError` instances with a `.code` property:

```js
import { ForgeError, ForgeErrorCode } from 'djs-forge';

try {
  await forge.polls.create(channelId, { ...tooManyAnswers });
} catch (err) {
  if (err instanceof ForgeError) {
    console.error(err.code);       // 'POLL_TOO_MANY_ANSWERS'
    console.error(err.message);    // '[djs-forge/POLL_TOO_MANY_ANSWERS] Poll can have at most 10 answers.'
    console.error(err.httpStatus); // null (not an HTTP error)
  }
}
```

---

## License

MIT — See [LICENSE](LICENSE)
