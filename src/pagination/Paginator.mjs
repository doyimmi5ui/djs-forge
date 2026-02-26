import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

const NAV_ID = {
  FIRST:    'forge_page_first',
  PREV:     'forge_page_prev',
  NEXT:     'forge_page_next',
  LAST:     'forge_page_last',
  STOP:     'forge_page_stop',
};

/**
 * Paginator — Dead-simple embed/message pagination for discord.js v14.
 *
 * @example
 * import { Paginator } from 'djs-forge/pagination';
 *
 * const pages = embeds.map(e => ({ embeds: [e] }));
 *
 * const paginator = new Paginator(pages, {
 *   timeout: 120_000,
 *   showPageCount: true,
 *   ephemeral: false,
 * });
 *
 * await paginator.reply(interaction);
 */
export class Paginator {
  /**
   * @param {Array<import('discord.js').InteractionReplyOptions>} pages
   * @param {PaginatorOptions} [options]
   */
  constructor(pages, options = {}) {
    if (!pages?.length) throw new ForgeError(ForgeErrorCode.PAGINATOR_NO_PAGES);

    this._pages      = pages;
    this._current    = options.startPage ?? 0;
    this._timeout    = options.timeout    ?? 120_000;
    this._showCount  = options.showPageCount ?? true;
    this._ephemeral  = options.ephemeral  ?? false;
    this._labels     = {
      first: options.labels?.first ?? '«',
      prev:  options.labels?.prev  ?? '‹',
      next:  options.labels?.next  ?? '›',
      last:  options.labels?.last  ?? '»',
      stop:  options.labels?.stop  ?? '✕',
    };
    this._showStop   = options.showStop   ?? true;
    this._userId     = options.userId     ?? null;   // restrict to a specific user
    this._collector  = null;
    this._message    = null;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Send as reply to a CommandInteraction / ButtonInteraction.
   * @param {import('discord.js').RepliableInteraction} interaction
   */
  async reply(interaction) {
    this._userId ??= interaction.user.id;
    const payload = this._buildPayload();
    this._message = await interaction.reply({ ...payload, fetchReply: true });
    this._startCollector();
  }

  /**
   * Send as a new message to a channel.
   * @param {import('discord.js').TextBasedChannel} channel
   * @param {string} [userId]  restrict navigation to this user
   */
  async send(channel, userId) {
    if (userId) this._userId = userId;
    const payload = this._buildPayload();
    this._message = await channel.send(payload);
    this._startCollector();
  }

  /**
   * Programmatically jump to a page index.
   * @param {number} index
   */
  async goTo(index) {
    if (index < 0 || index >= this._pages.length) {
      throw new ForgeError(ForgeErrorCode.PAGINATOR_INVALID_PAGE, `Index ${index} out of bounds`);
    }
    this._current = index;
    await this._update();
  }

  /** Stop the paginator immediately and disable all buttons. */
  async stop() {
    this._collector?.stop('manual');
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  _buildPayload() {
    const page     = this._pages[this._current];
    const total    = this._pages.length;
    const isFirst  = this._current === 0;
    const isLast   = this._current === total - 1;
    const onlyOne  = total === 1;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(NAV_ID.FIRST)
        .setLabel(this._labels.first)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isFirst || onlyOne),
      new ButtonBuilder()
        .setCustomId(NAV_ID.PREV)
        .setLabel(this._labels.prev)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isFirst || onlyOne),
      ...(this._showCount
        ? [new ButtonBuilder()
            .setCustomId('forge_page_count')
            .setLabel(`${this._current + 1} / ${total}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)]
        : []),
      new ButtonBuilder()
        .setCustomId(NAV_ID.NEXT)
        .setLabel(this._labels.next)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isLast || onlyOne),
      new ButtonBuilder()
        .setCustomId(NAV_ID.LAST)
        .setLabel(this._labels.last)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isLast || onlyOne),
      ...(this._showStop
        ? [new ButtonBuilder()
            .setCustomId(NAV_ID.STOP)
            .setLabel(this._labels.stop)
            .setStyle(ButtonStyle.Danger)]
        : []),
    );

    return {
      ...page,
      components: [...(page.components ?? []), row],
      ephemeral: this._ephemeral,
    };
  }

  _startCollector() {
    if (!this._message) return;

    this._collector = this._message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time:          this._timeout,
      filter:        (i) => {
        const allowed = !this._userId || i.user.id === this._userId;
        if (!allowed) i.reply({ content: '❌ This pagination is not for you.', ephemeral: true }).catch(() => {});
        return allowed && Object.values(NAV_ID).includes(i.customId);
      },
    });

    this._collector.on('collect', async (btn) => {
      await btn.deferUpdate();

      switch (btn.customId) {
        case NAV_ID.FIRST: this._current = 0;                          break;
        case NAV_ID.PREV:  this._current = Math.max(0, this._current - 1); break;
        case NAV_ID.NEXT:  this._current = Math.min(this._pages.length - 1, this._current + 1); break;
        case NAV_ID.LAST:  this._current = this._pages.length - 1;    break;
        case NAV_ID.STOP:  this._collector.stop('user'); return;
      }

      await this._update();
    });

    this._collector.on('end', async () => {
      await this._disable().catch(() => {});
    });
  }

  async _update() {
    const payload = this._buildPayload();
    delete payload.ephemeral;
    await this._message.edit(payload).catch(() => {});
  }

  async _disable() {
    if (!this._message) return;
    const page = this._pages[this._current];
    const disabledRow = new ActionRowBuilder().addComponents(
      ...(this._message.components.at(-1)?.components ?? []).map(c =>
        ButtonBuilder.from(c.toJSON()).setDisabled(true)
      )
    );
    await this._message.edit({
      ...page,
      components: [...(page.components ?? []), disabledRow],
    }).catch(() => {});
  }
}

/**
 * @typedef {object} PaginatorOptions
 * @property {number}  [startPage=0]       Starting page index
 * @property {number}  [timeout=120000]    Collector timeout in ms
 * @property {boolean} [showPageCount=true] Show "X / Y" counter button
 * @property {boolean} [showStop=true]     Show stop button
 * @property {boolean} [ephemeral=false]   Make the reply ephemeral
 * @property {string}  [userId]            Restrict navigation to one user
 * @property {{ first?: string, prev?: string, next?: string, last?: string, stop?: string }} [labels]
 */
