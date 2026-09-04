import { ChannelType, PermissionFlagsBits } from "discord.js";

async function getAssetChannel(guild) {
  let channel = guild.channels.cache.find(c => c.name === "kiddo-assets" && c.type === ChannelType.GuildText);
  if (channel) return channel;
  channel = await guild.channels.create({
    name: "kiddo-assets",
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] }
    ],
    reason: "Private KIDDO avatar storage"
  });
  return channel;
}

export async function storeAvatar(interaction, db, child, attachment) {
  if (!attachment.contentType?.startsWith("image/")) throw new Error("Please upload an image file for the avatar.");
  const assetChannel = await getAssetChannel(interaction.guild);
  const msg = await assetChannel.send({ content: `KIDDO avatar • ${child.name}`, files: [{ attachment: attachment.url, name: attachment.name ?? "avatar.png" }] });
  const url = msg.attachments.first()?.url;
  db.run("UPDATE children SET avatar_url=?, avatar_channel_id=?, avatar_message_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", [url, assetChannel.id, msg.id, child.id]);
  return url;
}

export async function resolveAvatarUrl(guild, child) {
  if (child.avatar_channel_id && child.avatar_message_id) {
    try {
      const channel = await guild.channels.fetch(child.avatar_channel_id);
      const msg = await channel.messages.fetch(child.avatar_message_id);
      return msg.attachments.first()?.url ?? child.avatar_url ?? null;
    } catch {}
  }
  return child.avatar_url ?? null;
}

export async function sendAsChild(interaction, child, content, avatarURL) {
  const channel = interaction.channel;
  if (!channel?.isTextBased() || !interaction.guild) throw new Error("KIDDO proxying requires a server text channel.");
  let webhook = (await channel.fetchWebhooks()).find(w => w.owner?.id === interaction.client.user.id && w.name === "KIDDO Proxy");
  if (!webhook) webhook = await channel.createWebhook({ name: "KIDDO Proxy", reason: "KIDDO child proxy messages" });
  await webhook.send({
    content: String(content).slice(0, 2000),
    username: child.nickname || child.name,
    avatarURL: avatarURL || undefined,
    allowedMentions: { parse: [] },
    threadId: interaction.channel.isThread?.() ? interaction.channel.id : undefined
  });
}
