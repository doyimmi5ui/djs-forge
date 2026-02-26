import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { ForgeError, ForgeErrorCode } from '../errors/ForgeError.mjs';

const DEFAULT_ID = {
  CONFIRM: 'forge_confirm_yes',
  CANCEL:  'forge_confirm_no',
};

/**
 * ConfirmationManager — await a yes/no confirmation from the user.
 *
 * Sends a message with Confirm / Cancel buttons and resolves with the result.
 * The message is automatically updated after the user responds.
 *
 * @example
 * import { ConfirmationManager } from 'djs-forge/confirmations';
 *
 * const confirm = new ConfirmationManager();
 *
 * // In a slash command:
 * const confirmed = await confirm.ask(interaction, {
 *   content: '⚠️ Are you sure you want to delete **all** messages?',
 * });
 *
 * if (!confirmed) return interaction.editReply({ content: 'Cancelled.' });
 *
 * // ... proceed
 */
export class ConfirmationManager {
  /**
   * @param {ConfirmationDefaults} [defaults]
   */
  constructor(defaults = {}) {
    this._defaults = {
      timeout:        defaults.timeout        ?? 30_000,
      ephemeral:      defaults.ephemeral      ?? true,
      confirmLabel:   defaults.confirmLabel   ?? 'Confirm',
      confirmStyle:   defaults.confirmStyle   ?? ButtonStyle.Danger,
      cancelLabel:    defaults.cancelLabel    ?? 'Cancel',
      cancelStyle:    defaults.cancelStyle    ?? ButtonStyle.Secondary,
      confirmedText:  defaults.confirmedText  ?? '✅ Confirmed.',
      cancelledText:  defaults.cancelledText  ?? '❌ Cancelled.',
      timedOutText:   defaults.timedOutText   ?? '⏳ Timed out.',
      updateReply:    defaults.updateReply    !== false,
    };
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Ask for a confirmation via an interaction reply.
   * Resolves `true` on confirm, `false` on cancel.
   * Throws `ForgeError(CONFIRMATION_TIMED_OUT)` on timeout.
   *
   * @param {import('discord.js').RepliableInteraction} interaction
   * @param {ConfirmationAskOptions} [options]
   * @returns {Promise<boolean>}
   */
  async ask(interaction, options = {}) {
    const opts = { ...this._defaults, ...options };

    const nonce   = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const yesId   = `${DEFAULT_ID.CONFIRM}_${nonce}`;
    const noId    = `${DEFAULT_ID.CANCEL}_${nonce}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(yesId)
        .setLabel(opts.confirmLabel)
        .setStyle(opts.confirmStyle),
      new ButtonBuilder()
        .setCustomId(noId)
        .setLabel(opts.cancelLabel)
        .setStyle(opts.cancelStyle),
    );

    const payload = {
      content:    opts.content    ?? undefined,
      embeds:     opts.embeds     ?? [],
      components: [...(opts.components ?? []), row],
      ephemeral:  opts.ephemeral,
      fetchReply: true,
    };

    const message = await (interaction.deferred || interaction.replied
      ? interaction.editReply(payload)
      : interaction.reply(payload));

    return new Promise((resolve, reject) => {
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time:          opts.timeout,
        max:           1,
        filter:        (i) => {
          const isOwner = i.user.id === interaction.user.id;
          if (!isOwner) {
            i.reply({ content: '❌ This confirmation is not for you.', ephemeral: true }).catch(() => {});
          }
          return isOwner && (i.customId === yesId || i.customId === noId);
        },
      });

      collector.on('collect', async (btn) => {
        await btn.deferUpdate();
        const confirmed = btn.customId === yesId;

        if (opts.updateReply) {
          await message.edit({
            content:    confirmed ? opts.confirmedText : opts.cancelledText,
            embeds:     [],
            components: [],
          }).catch(() => {});
        }

        resolve(confirmed);
      });

      collector.on('end', async (_, reason) => {
        if (reason !== 'limit') {
          if (opts.updateReply) {
            await message.edit({
              content: opts.timedOutText, embeds: [], components: [],
            }).catch(() => {});
          }
          reject(new ForgeError(ForgeErrorCode.CONFIRMATION_TIMED_OUT));
        }
      });
    });
  }
}

/**
 * @typedef {object} ConfirmationDefaults
 * @property {number}  [timeout=30000]
 * @property {boolean} [ephemeral=true]
 * @property {string}  [confirmLabel='Confirm']
 * @property {import('discord.js').ButtonStyle} [confirmStyle]
 * @property {string}  [cancelLabel='Cancel']
 * @property {import('discord.js').ButtonStyle} [cancelStyle]
 * @property {string}  [confirmedText]
 * @property {string}  [cancelledText]
 * @property {string}  [timedOutText]
 * @property {boolean} [updateReply=true]  Whether to update the message after response
 */

/**
 * @typedef {object} ConfirmationAskOptions
 * @property {string} [content]
 * @property {Array}  [embeds]
 * @property {Array}  [components]
 * @property {number} [timeout]
 * @property {boolean}[ephemeral]
 * @property {string} [confirmLabel]
 * @property {string} [cancelLabel]
 */
