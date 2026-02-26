/**
 * djs-forge — Complete example bot
 *
 * Shows: InteractionRouter, Paginator, CooldownManager,
 *        ConfirmationManager, WebhookManager, EmbedPresets, Timestamp, Perms
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Routes,
} from 'discord.js';

import { DjsForge, EmbedPresets, Timestamp, Perms, Strings } from 'djs-forge';
import { Paginator }           from 'djs-forge/pagination';
import { ConfirmationManager } from 'djs-forge/confirmations';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const forge   = new DjsForge(client);
const confirm = new ConfirmationManager({ timeout: 20_000 });

// ─── Register slash commands (run once) ──────────────────────────────────────

const commands = [
  { name: 'pages',   description: 'Demo the paginator' },
  { name: 'ban',     description: 'Ban a user (with cooldown + confirmation)' },
  { name: 'info',    description: 'Server info with Timestamp utils' },
];

// ─── Interaction Router ───────────────────────────────────────────────────────
// No more  if (i.customId === 'x') else if (i.customId === 'y')

forge.router
  // Exact match
  .on('open_ticket', async (interaction) => {
    await interaction.reply({
      embeds: [EmbedPresets.success('Ticket Opened', 'Staff will be with you shortly.')],
      ephemeral: true,
    });
  })

  // Wildcard glob — "role_*" matches "role_admin", "role_mod", ...
  .on('role_*', async (interaction, { wildcard }) => {
    await interaction.reply({
      embeds: [EmbedPresets.info('Role Assigned', `You got the **${wildcard}** role.`)],
      ephemeral: true,
    });
  })

  // Named-group regex — extract dynamic IDs cleanly
  .on(/^confirm_ban_(?<userId>\d+)$/, async (interaction, { userId }) => {
    await interaction.reply({
      embeds: [EmbedPresets.success('Banned', `User <@${userId}> has been banned.`)],
    });
  })

  // Fallback
  .fallback(async (interaction) => {
    await interaction.reply({ content: '❓ Unknown action.', ephemeral: true });
  })

  .attach(client);

// ─── Command Handler ──────────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ── /pages — Paginator demo ──
  if (interaction.commandName === 'pages') {
    const pages = Array.from({ length: 8 }, (_, i) => ({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`📄 Page ${i + 1} of 8`)
          .setDescription(`This is page **${i + 1}**.\n\nCreated: ${Timestamp.relative(Date.now())}`)
          .setFooter({ text: 'djs-forge/pagination' }),
      ],
    }));

    await new Paginator(pages, { showPageCount: true, timeout: 60_000 }).reply(interaction);
    return;
  }

  // ── /ban — Cooldown + Confirmation + Permission check ──
  if (interaction.commandName === 'ban') {
    // Permission check
    if (!Perms.botHas(interaction, ['BanMembers'])) {
      return interaction.reply({
        embeds: [EmbedPresets.error('Missing Permissions', Perms.missingText(interaction, ['BanMembers']))],
        ephemeral: true,
      });
    }

    // Cooldown: 30 seconds per user
    const cd = forge.cooldowns.check('ban', interaction.user.id, 30_000);
    if (cd.onCooldown) {
      return interaction.reply({
        embeds: [EmbedPresets.warning('On Cooldown', `Please wait **${cd.remainingText}** before using this again.`)],
        ephemeral: true,
      });
    }
    forge.cooldowns.set('ban', interaction.user.id, 30_000);

    // Confirmation
    let confirmed;
    try {
      confirmed = await confirm.ask(interaction, {
        embeds: [EmbedPresets.warning('Confirm Ban', '⚠️ This will permanently ban the user. Are you sure?')],
      });
    } catch {
      return; // Timed out — message already updated
    }

    if (!confirmed) return; // Cancelled — message already updated

    await interaction.editReply({
      embeds: [EmbedPresets.success('User Banned', 'The user has been banned.')],
      components: [],
    });
    return;
  }

  // ── /info — Timestamp utils ──
  if (interaction.commandName === 'info') {
    const guild = interaction.guild;
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`📊 ${guild.name}`)
          .addFields(
            { name: 'Members',  value: Strings.formatNumber(guild.memberCount), inline: true },
            { name: 'Created',  value: Timestamp.relative(guild.createdAt),    inline: true },
            { name: 'Since',    value: Timestamp.full(guild.createdAt),         inline: true },
          ),
      ],
    });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
