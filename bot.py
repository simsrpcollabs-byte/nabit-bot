from __future__ import annotations
import discord
from discord.ext import commands
from config import settings
from db import Database
from behavior import BehaviorEngine

class KiddoBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        super().__init__(command_prefix="!", intents=intents)
        self.db = Database(settings.database_path)
        self.behavior = BehaviorEngine(settings.openai_api_key, settings.openai_model)

    async def setup_hook(self):
        await self.db.init()
        await self.load_extension("kiddo_commands")
        await self.load_extension("world_commands")
        if settings.dev_guild_id:
            guild = discord.Object(id=settings.dev_guild_id)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()

    async def on_ready(self):
        print(f"KIDDO online as {self.user} ({self.user.id})")


def run():
    if not settings.discord_token:
        raise RuntimeError("DISCORD_TOKEN is missing. Copy .env.example to .env and fill it in.")
    KiddoBot().run(settings.discord_token)
