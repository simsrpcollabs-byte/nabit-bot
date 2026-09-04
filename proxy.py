from __future__ import annotations

import discord

ASSET_CHANNEL_NAME = "kiddo-assets"
WEBHOOK_NAME = "KIDDO Proxy"
MAX_AVATAR_BYTES = 8 * 1024 * 1024


def _bot_member(guild: discord.Guild, bot_user_id: int) -> discord.Member | None:
    return guild.get_member(bot_user_id)


async def ensure_asset_channel(guild: discord.Guild, bot_user_id: int) -> discord.TextChannel:
    existing = discord.utils.get(guild.text_channels, name=ASSET_CHANNEL_NAME)
    if existing:
        return existing

    me = _bot_member(guild, bot_user_id)
    if me is None:
        raise RuntimeError("KIDDO could not resolve its server member record.")

    perms = me.guild_permissions
    if not perms.manage_channels:
        raise PermissionError(
            "KIDDO needs **Manage Channels** once so it can create a private `#kiddo-assets` channel for persistent child avatars."
        )

    overwrites = {
        guild.default_role: discord.PermissionOverwrite(view_channel=False),
        me: discord.PermissionOverwrite(
            view_channel=True,
            send_messages=True,
            read_message_history=True,
            attach_files=True,
        ),
    }
    return await guild.create_text_channel(
        ASSET_CHANNEL_NAME,
        overwrites=overwrites,
        reason="KIDDO persistent child avatar storage",
    )


async def store_avatar(bot, interaction: discord.Interaction, child: dict, attachment: discord.Attachment) -> str:
    if not interaction.guild:
        raise RuntimeError("Avatars can only be set inside a server.")

    content_type = (attachment.content_type or "").lower()
    filename = attachment.filename.lower()
    allowed_ext = filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif"))
    if content_type and not content_type.startswith("image/"):
        raise ValueError("Please upload an image file for the avatar.")
    if not content_type and not allowed_ext:
        raise ValueError("Please upload a PNG, JPG, WEBP, or GIF image.")
    if attachment.size > MAX_AVATAR_BYTES:
        raise ValueError("That avatar is too large. Keep it under 8 MB.")

    channel = await ensure_asset_channel(interaction.guild, bot.user.id)

    # Remove the previous stored asset after the replacement is safely posted.
    old_channel_id = child.get("avatar_channel_id")
    old_message_id = child.get("avatar_message_id")

    file = await attachment.to_file(use_cached=True)
    msg = await channel.send(
        content=f"KIDDO avatar asset • {child['name']} • child_id={child['id']}",
        file=file,
        allowed_mentions=discord.AllowedMentions.none(),
    )
    avatar_url = msg.attachments[0].url

    await bot.db.execute(
        "UPDATE children SET avatar_channel_id=?, avatar_message_id=?, avatar_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (channel.id, msg.id, avatar_url, child["id"]),
    )

    if old_channel_id and old_message_id:
        try:
            old_channel = interaction.guild.get_channel(int(old_channel_id)) or await interaction.guild.fetch_channel(int(old_channel_id))
            old_msg = await old_channel.fetch_message(int(old_message_id))
            await old_msg.delete()
        except (discord.NotFound, discord.Forbidden, discord.HTTPException, AttributeError, ValueError):
            pass

    return avatar_url


async def resolve_avatar_url(bot, guild: discord.Guild, child: dict) -> str | None:
    channel_id = child.get("avatar_channel_id")
    message_id = child.get("avatar_message_id")

    if channel_id and message_id:
        try:
            channel = guild.get_channel(int(channel_id)) or await guild.fetch_channel(int(channel_id))
            msg = await channel.fetch_message(int(message_id))
            if msg.attachments:
                fresh_url = msg.attachments[0].url
                if fresh_url != child.get("avatar_url"):
                    await bot.db.execute(
                        "UPDATE children SET avatar_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        (fresh_url, child["id"]),
                    )
                return fresh_url
        except (discord.NotFound, discord.Forbidden, discord.HTTPException, AttributeError, ValueError):
            pass

    return child.get("avatar_url") or None


async def _webhook_for_channel(channel: discord.abc.GuildChannel) -> discord.Webhook:
    webhooks = await channel.webhooks()
    for hook in webhooks:
        if hook.name == WEBHOOK_NAME:
            return hook
    return await channel.create_webhook(name=WEBHOOK_NAME, reason="KIDDO roleplay proxy")


def _chunks(text: str, limit: int = 2000) -> list[str]:
    text = text.strip()
    if len(text) <= limit:
        return [text]
    parts: list[str] = []
    while text:
        if len(text) <= limit:
            parts.append(text)
            break
        cut = text.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = text.rfind(" ", 0, limit)
        if cut < limit // 2:
            cut = limit
        parts.append(text[:cut].rstrip())
        text = text[cut:].lstrip()
    return parts


async def send_as_child(bot, interaction: discord.Interaction, child: dict, content: str) -> None:
    if not interaction.guild or not interaction.channel:
        raise RuntimeError("KIDDO proxy messages can only be sent inside a server channel.")

    target = interaction.channel
    thread: discord.Thread | None = target if isinstance(target, discord.Thread) else None
    webhook_channel = target.parent if thread else target

    if not isinstance(webhook_channel, discord.TextChannel):
        raise RuntimeError("KIDDO proxy currently works in text channels and threads.")

    me = interaction.guild.get_member(bot.user.id)
    permissions = webhook_channel.permissions_for(me) if me else None
    if not permissions or not permissions.manage_webhooks:
        raise PermissionError("KIDDO needs **Manage Webhooks** in this channel to proxy as registered children.")

    avatar_url = await resolve_avatar_url(bot, interaction.guild, child)
    webhook = await _webhook_for_channel(webhook_channel)
    display_name = child.get("nickname") or child["name"]

    for piece in _chunks(content):
        kwargs = {
            "content": piece,
            "username": display_name[:80],
            "avatar_url": avatar_url,
            "allowed_mentions": discord.AllowedMentions.none(),
            "wait": True,
        }
        if thread:
            kwargs["thread"] = thread
        await webhook.send(**kwargs)
