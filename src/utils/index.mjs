import { EmbedBuilder, PermissionsBitField } from 'discord.js';

// ─── EmbedPresets ─────────────────────────────────────────────────────────────

/**
 * Preset embed builders — stop copy-pasting embed boilerplate.
 *
 * @example
 * import { EmbedPresets } from 'djs-forge/utils';
 *
 * interaction.reply({ embeds: [EmbedPresets.success('Done!', 'The user was banned.')] });
 * interaction.reply({ embeds: [EmbedPresets.error('Failed', 'Missing permissions.')] });
 */
export const EmbedPresets = {
  /**
   * Green success embed.
   * @param {string} title
   * @param {string} [description]
   * @param {object} [extra]  Extra EmbedBuilder fields
   */
  success(title, description, extra = {}) {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`✅ ${title}`);
    if (description) embed.setDescription(description);
    return _applyExtra(embed, extra);
  },

  /**
   * Red error embed.
   * @param {string} title
   * @param {string} [description]
   */
  error(title, description, extra = {}) {
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ ${title}`);
    if (description) embed.setDescription(description);
    return _applyExtra(embed, extra);
  },

  /**
   * Yellow warning embed.
   */
  warning(title, description, extra = {}) {
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`⚠️ ${title}`);
    if (description) embed.setDescription(description);
    return _applyExtra(embed, extra);
  },

  /**
   * Blue info embed.
   */
  info(title, description, extra = {}) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`ℹ️ ${title}`);
    if (description) embed.setDescription(description);
    return _applyExtra(embed, extra);
  },

  /**
   * Neutral loading embed.
   */
  loading(title = 'Loading…', description, extra = {}) {
    const embed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle(`⏳ ${title}`);
    if (description) embed.setDescription(description);
    return _applyExtra(embed, extra);
  },

  /**
   * Blank embed with custom colour, useful as a base.
   * @param {number} color  Hex number e.g. 0xff0000
   */
  blank(color = 0x2c2f33) {
    return new EmbedBuilder().setColor(color);
  },
};

function _applyExtra(embed, extra) {
  if (extra.fields)    embed.addFields(extra.fields);
  if (extra.footer)    embed.setFooter(extra.footer);
  if (extra.thumbnail) embed.setThumbnail(extra.thumbnail);
  if (extra.image)     embed.setImage(extra.image);
  if (extra.timestamp) embed.setTimestamp(extra.timestamp === true ? Date.now() : extra.timestamp);
  if (extra.author)    embed.setAuthor(extra.author);
  return embed;
}

// ─── TimestampUtils ───────────────────────────────────────────────────────────

/**
 * Discord timestamp utilities — stop Googling the format chars every time.
 *
 * @example
 * import { Timestamp } from 'djs-forge/utils';
 *
 * message.reply(Timestamp.relative(date));     // "5 minutes ago"
 * message.reply(Timestamp.full(date));         // "15 January 2025 14:30"
 * message.reply(Timestamp.time(date));         // "14:30"
 */
export const Timestamp = {
  /** Relative time:  "5 minutes ago" */
  relative:    (date) => `<t:${toSec(date)}:R>`,
  /** Short time:     "14:30" */
  time:        (date) => `<t:${toSec(date)}:t>`,
  /** Long time:      "14:30:00" */
  timeLong:    (date) => `<t:${toSec(date)}:T>`,
  /** Short date:     "15/01/2025" */
  date:        (date) => `<t:${toSec(date)}:d>`,
  /** Long date:      "15 January 2025" */
  dateLong:    (date) => `<t:${toSec(date)}:D>`,
  /** Short datetime: "15 January 2025 14:30" */
  full:        (date) => `<t:${toSec(date)}:f>`,
  /** Long datetime:  "Wednesday, 15 January 2025 14:30" */
  fullLong:    (date) => `<t:${toSec(date)}:F>`,
  /** Raw Unix seconds */
  unix:        (date) => toSec(date),
};

function toSec(date) {
  if (typeof date === 'number') return Math.floor(date > 1e10 ? date / 1000 : date);
  return Math.floor((date instanceof Date ? date : new Date(date)).getTime() / 1000);
}

// ─── PermissionUtils ──────────────────────────────────────────────────────────

/**
 * Permission helper utilities.
 *
 * @example
 * import { Perms } from 'djs-forge/utils';
 *
 * if (!Perms.botHas(interaction, ['BanMembers', 'KickMembers'])) {
 *   return interaction.reply({ content: Perms.missingText(interaction, ['BanMembers']), ephemeral: true });
 * }
 */
export const Perms = {
  /**
   * Check if the bot has all given permissions in the interaction's channel.
   * @param {import('discord.js').BaseInteraction} interaction
   * @param {string[]} permissions  e.g. ['BanMembers', 'ManageChannels']
   */
  botHas(interaction, permissions) {
    const me = interaction.guild?.members?.me;
    if (!me) return false;
    const channel = interaction.channel;
    const perms = channel
      ? me.permissionsIn(channel)
      : me.permissions;
    return perms.has(permissions.map(p => PermissionsBitField.Flags[p]).filter(Boolean));
  },

  /**
   * Check if the invoking member has all given permissions.
   */
  memberHas(interaction, permissions) {
    const member = interaction.member;
    if (!member) return false;
    return member.permissions.has(permissions.map(p => PermissionsBitField.Flags[p]).filter(Boolean));
  },

  /**
   * Returns a formatted string listing missing permissions.
   * @param {import('discord.js').BaseInteraction} interaction
   * @param {string[]} permissions
   */
  missingText(interaction, permissions) {
    const missing = permissions.filter(p => !Perms.botHas(interaction, [p]));
    if (!missing.length) return '';
    const list = missing.map(p => `\`${p}\``).join(', ');
    return `❌ I'm missing the following permissions: ${list}`;
  },
};

// ─── StringUtils ─────────────────────────────────────────────────────────────

/**
 * String utilities for Discord messages.
 *
 * @example
 * import { Strings } from 'djs-forge/utils';
 *
 * Strings.truncate(longText, 100)    // "Hello world…"
 * Strings.codeblock(code, 'js')     // "```js\n...\n```"
 * Strings.chunk(longText, 2000)     // ['chunk1', 'chunk2', ...]
 */
export const Strings = {
  /**
   * Truncate text to a max length with an ellipsis.
   * @param {string} text
   * @param {number} max
   * @param {string} [suffix='…']
   */
  truncate(text, max, suffix = '…') {
    if (text.length <= max) return text;
    return text.slice(0, max - suffix.length) + suffix;
  },

  /**
   * Wrap text in a Discord code block.
   * @param {string} code
   * @param {string} [lang='']
   */
  codeblock(code, lang = '') {
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  },

  /**
   * Split text into chunks that fit within Discord's character limits.
   * @param {string} text
   * @param {number} [maxLength=2000]
   * @returns {string[]}
   */
  chunk(text, maxLength = 2_000) {
    const chunks = [];
    while (text.length > maxLength) {
      let idx = text.lastIndexOf('\n', maxLength);
      if (idx <= 0) idx = maxLength;
      chunks.push(text.slice(0, idx));
      text = text.slice(idx).trimStart();
    }
    if (text) chunks.push(text);
    return chunks;
  },

  /**
   * Pluralise a word based on count.
   * @param {number} count
   * @param {string} singular
   * @param {string} [plural]  Defaults to `singular + 's'`
   */
  plural(count, singular, plural) {
    return count === 1 ? singular : (plural ?? `${singular}s`);
  },

  /**
   * Escape Discord markdown characters.
   * @param {string} text
   */
  escapeMarkdown(text) {
    return text.replace(/([*_`~\\|>])/g, '\\$1');
  },

  /**
   * Format a number with locale-aware thousands separators.
   * @param {number} n
   * @param {string} [locale='en-US']
   */
  formatNumber(n, locale = 'en-US') {
    return n.toLocaleString(locale);
  },
};

// ─── MentionUtils ─────────────────────────────────────────────────────────────

/**
 * Mention shorthand helpers — no more memorising mention syntax.
 *
 * @example
 * import { Mention } from 'djs-forge/utils';
 *
 * `Welcome ${Mention.user(userId)}!`
 * `Please check ${Mention.channel(channelId)}`
 */
export const Mention = {
  user:    (id) => `<@${id}>`,
  channel: (id) => `<#${id}>`,
  role:    (id) => `<@&${id}>`,
  /** Slash command mention: /name id */
  command: (name, id) => `</${name}:${id}>`,
  /** Custom emoji */
  emoji:   (name, id, animated = false) => animated ? `<a:${name}:${id}>` : `<:${name}:${id}>`,
};
