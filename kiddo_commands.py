from __future__ import annotations
import discord
from discord import app_commands
from discord.ext import commands
from datetime import date
from constants import TEMPERAMENTS, TRAITS, MOODS, DESTINATIONS, SUMMARY_STYLES
from utils import stage_for_months
from ui import profile_embed, behavior_embed

class KiddoCog(commands.GroupCog, group_name="kiddo", group_description="Simulate child and teen behavior"):
    def __init__(self, bot):
        self.bot = bot

    async def child_autocomplete(self, interaction: discord.Interaction, current: str):
        rows = await self.bot.db.fetchall("SELECT name FROM children WHERE guild_id=? AND lower(name) LIKE lower(?) ORDER BY name LIMIT 25", (interaction.guild_id, f"%{current}%"))
        return [app_commands.Choice(name=r["name"], value=r["name"]) for r in rows]

    async def _get(self, interaction, name):
        child = await self.bot.db.get_child(interaction.guild_id, name)
        if not child:
            await interaction.followup.send(f"I can't find **{name}** in this server's KIDDO registry.", ephemeral=True)
        return child

    @app_commands.command(name="register", description="Register a child or teen, birth through age 17")
    @app_commands.describe(name="Character name", age_months="Age in months (e.g. 8, 36, 192)", primary_temperament="Age-appropriate base temperament", secondary_temperament="Optional second temperament", traits="3-5 comma-separated traits", notes="Specific behavior/quirks", birthday="Optional YYYY-MM-DD", pronouns="Optional pronouns")
    async def register(self, interaction: discord.Interaction, name: str, age_months: app_commands.Range[int,0,215], primary_temperament: str, traits: str, secondary_temperament: str|None=None, notes: str|None=None, birthday: str|None=None, pronouns: str|None=None):
        stage = stage_for_months(age_months)
        allowed = TEMPERAMENTS[stage]
        if primary_temperament not in allowed or (secondary_temperament and secondary_temperament not in allowed):
            return await interaction.response.send_message(f"For **{stage}**, use: {', '.join(allowed)}", ephemeral=True)
        trait_list = [t.strip() for t in traits.split(",") if t.strip()][:5]
        if not 1 <= len(trait_list) <= 5:
            return await interaction.response.send_message("Give me 1-5 comma-separated traits.", ephemeral=True)
        existing = await self.bot.db.get_child(interaction.guild_id, name)
        if existing:
            return await interaction.response.send_message(f"**{name}** is already registered. Use `/kiddo edit`.", ephemeral=True)
        if birthday:
            try: date.fromisoformat(birthday)
            except ValueError: return await interaction.response.send_message("Birthday must be `YYYY-MM-DD`.", ephemeral=True)
        child_id = await self.bot.db.add_child(guild_id=interaction.guild_id, created_by=interaction.user.id, name=name, age_months=age_months, stage=stage, primary_temperament=primary_temperament, secondary_temperament=secondary_temperament, pronouns=pronouns, birthday=birthday, nickname=None, notes=notes, traits=trait_list)
        child = await self.bot.db.get_child(interaction.guild_id, name)
        await interaction.response.send_message(embed=profile_embed(child))

    @register.autocomplete("primary_temperament")
    async def register_primary(self, interaction: discord.Interaction, current: str):
        return [app_commands.Choice(name=x, value=x) for x in sum(TEMPERAMENTS.values(), []) if current.lower() in x.lower()][:25]

    @register.autocomplete("secondary_temperament")
    async def register_secondary(self, interaction: discord.Interaction, current: str):
        return await self.register_primary(interaction, current)

    @app_commands.command(name="profile", description="View a registered KIDDO profile")
    @app_commands.autocomplete(name=child_autocomplete)
    async def profile(self, interaction: discord.Interaction, name: str):
        await interaction.response.defer()
        child = await self._get(interaction, name)
        if child: await interaction.followup.send(embed=profile_embed(child))

    @app_commands.command(name="mood", description="Set a temporary current mood/state")
    @app_commands.autocomplete(name=child_autocomplete)
    async def mood(self, interaction: discord.Interaction, name: str, mood: str):
        if mood not in MOODS:
            return await interaction.response.send_message(f"Choose one of: {', '.join(MOODS)}", ephemeral=True)
        await self.bot.db.execute("UPDATE children SET current_mood=?, updated_at=CURRENT_TIMESTAMP WHERE guild_id=? AND lower(name)=lower(?)", (mood, interaction.guild_id, name))
        await interaction.response.send_message(f"🧸 **{name}** is now **{mood}**.")

    @mood.autocomplete("mood")
    async def mood_auto(self, interaction: discord.Interaction, current: str):
        return [app_commands.Choice(name=x, value=x) for x in MOODS if current.lower() in x.lower()]

    @app_commands.command(name="react", description="See how this child would react to a situation")
    @app_commands.autocomplete(name=child_autocomplete)
    async def react(self, interaction: discord.Interaction, name: str, situation: str, detail: str="Standard"):
        await interaction.response.defer()
        child = await self._get(interaction, name)
        if not child: return
        result = await self.bot.behavior.generate(child, "Determine this child's immediate and near-term reaction to the supplied situation.", situation, detail)
        await self._save_observations(child, result, "react")
        await interaction.followup.send(embed=behavior_embed(result))

    @app_commands.command(name="scenario", description="Generate an organic RP behavior moment")
    @app_commands.autocomplete(name=child_autocomplete)
    async def scenario(self, interaction: discord.Interaction, name: str, context: str="At home during an ordinary part of the day", detail: str="Standard"):
        await interaction.response.defer()
        child = await self._get(interaction, name)
        if not child: return
        result = await self.bot.behavior.generate(child, "Generate one organic, developmentally appropriate RP scenario and determine the child's behavior.", context, detail)
        await self._save_observations(child, result, "scenario")
        await interaction.followup.send(embed=behavior_embed(result))

    @app_commands.command(name="send", description="Simulate time at school, daycare, grandparents, a sitter, etc.")
    @app_commands.autocomplete(name=child_autocomplete)
    async def send(self, interaction: discord.Interaction, name: str, destination: str, hours: app_commands.Range[float,0.5,48], detail: str="Standard", starting_context: str|None=None):
        await interaction.response.defer()
        child = await self._get(interaction, name)
        if not child: return
        context = f"Destination: {destination}. Duration: {hours} hours. Starting context: {starting_context or 'none'}. Simulate arrival/drop-off, age-appropriate activities and needs, social behavior, transitions, any ordinary conflict only if warranted, and return/pickup. Scale the number of events to duration."
        result = await self.bot.behavior.generate(child, "Simulate this off-screen visit/day and return an RP-ready summary.", context, detail)
        await self._save_observations(child, result, f"send:{destination}")
        await interaction.followup.send(embed=behavior_embed(result))

    @send.autocomplete("destination")
    async def destination_auto(self, interaction: discord.Interaction, current: str):
        rows = await self.bot.db.fetchall("SELECT name FROM locations WHERE guild_id=? AND lower(name) LIKE lower(?) LIMIT 15", (interaction.guild_id, f"%{current}%"))
        vals = DESTINATIONS + [r["name"] for r in rows]
        return [app_commands.Choice(name=x, value=x) for x in vals if current.lower() in x.lower()][:25]

    @app_commands.command(name="day", description="Generate a broader day-in-the-life behavior summary")
    @app_commands.autocomplete(name=child_autocomplete)
    async def day(self, interaction: discord.Interaction, name: str, context: str="Normal day", detail: str="Detailed"):
        await interaction.response.defer()
        child = await self._get(interaction, name)
        if not child: return
        result = await self.bot.behavior.generate(child, "Simulate a believable day using registered routines, schedule, school, relationships and current mood where relevant.", context, detail)
        await self._save_observations(child, result, "day")
        await interaction.followup.send(embed=behavior_embed(result))

    @app_commands.command(name="edit", description="Edit core profile fields")
    @app_commands.autocomplete(name=child_autocomplete)
    async def edit(self, interaction: discord.Interaction, name: str, notes: str|None=None, primary_temperament: str|None=None, secondary_temperament: str|None=None, traits: str|None=None):
        child = await self.bot.db.get_child(interaction.guild_id, name)
        if not child: return await interaction.response.send_message("Child not found.", ephemeral=True)
        updates, params = [], []
        for field, value in (("notes",notes),("primary_temperament",primary_temperament),("secondary_temperament",secondary_temperament)):
            if value is not None: updates.append(f"{field}=?"); params.append(value)
        if updates:
            params.append(child["id"]); await self.bot.db.execute(f"UPDATE children SET {', '.join(updates)}, updated_at=CURRENT_TIMESTAMP WHERE id=?", params)
        if traits is not None:
            vals = [x.strip() for x in traits.split(",") if x.strip()][:5]
            await self.bot.db.execute("DELETE FROM child_traits WHERE child_id=?", (child["id"],))
            for t in vals: await self.bot.db.execute("INSERT OR IGNORE INTO child_traits(child_id,trait) VALUES(?,?)", (child["id"],t))
        fresh = await self.bot.db.get_child(interaction.guild_id, name)
        await interaction.response.send_message(embed=profile_embed(fresh))

    @app_commands.command(name="ageup", description="Change age and move to the appropriate developmental stage")
    @app_commands.autocomplete(name=child_autocomplete)
    async def ageup(self, interaction: discord.Interaction, name: str, new_age_months: app_commands.Range[int,0,215]):
        child = await self.bot.db.get_child(interaction.guild_id, name)
        if not child: return await interaction.response.send_message("Child not found.", ephemeral=True)
        new_stage = stage_for_months(new_age_months)
        await self.bot.db.execute("UPDATE children SET age_months=?, stage=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (new_age_months,new_stage,child["id"]))
        allowed = ", ".join(TEMPERAMENTS[new_stage])
        await interaction.response.send_message(f"🎂 **{name}** is now in **{new_stage}**. Existing temperament stayed canon.\nSuggested options for this stage: {allowed}")

    @app_commands.command(name="history", description="View canon, observed and suggested behavior history")
    @app_commands.autocomplete(name=child_autocomplete)
    async def history(self, interaction: discord.Interaction, name: str):
        child = await self.bot.db.get_child(interaction.guild_id, name)
        if not child: return await interaction.response.send_message("Child not found.", ephemeral=True)
        rows = await self.bot.db.fetchall("SELECT event_type,description,canon_status,happened_at FROM history WHERE child_id=? ORDER BY happened_at DESC LIMIT 20", (child["id"],))
        obs = await self.bot.db.fetchall("SELECT category,observation,confidence FROM observations WHERE child_id=? AND promoted=0 ORDER BY created_at DESC LIMIT 8", (child["id"],))
        text = "\n".join(f"• **{r['canon_status']} / {r['event_type']}** — {r['description']}" for r in rows) or "No history logged yet."
        if obs: text += "\n\n**Unconfirmed observations**\n" + "\n".join(f"• {r['category']}: {r['observation']} ({r['confidence']}%)" for r in obs)
        await interaction.response.send_message(text[:1900])

    @app_commands.command(name="milestone", description="Log a milestone as confirmed canon")
    @app_commands.autocomplete(name=child_autocomplete)
    async def milestone(self, interaction: discord.Interaction, name: str, milestone: str):
        child = await self.bot.db.get_child(interaction.guild_id, name)
        if not child: return await interaction.response.send_message("Child not found.", ephemeral=True)
        await self.bot.db.execute("INSERT INTO history(child_id,event_type,description,canon_status) VALUES(?,?,?,'canon')", (child["id"],"milestone",milestone))
        await interaction.response.send_message(f"⭐ Logged for **{name}**: {milestone}")

    async def _save_observations(self, child: dict, result: dict, source: str):
        for obs in (result.get("observations") or [])[:3]:
            if isinstance(obs, dict) and obs.get("text"):
                await self.bot.db.log_observation(child["id"], source, str(obs.get("category","behavior")), str(obs["text"]), max(0,min(100,int(obs.get("confidence",20)))))

async def setup(bot):
    await bot.add_cog(KiddoCog(bot))
