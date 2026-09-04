from __future__ import annotations
import json
import discord
from discord import app_commands
from discord.ext import commands

class WorldCog(commands.GroupCog, group_name="world", group_description="KIDDO schools, relationships, groups, routines and schedules"):
    def __init__(self, bot): self.bot = bot

    async def child_auto(self, interaction: discord.Interaction, current: str):
        rows = await self.bot.db.fetchall("SELECT name FROM children WHERE guild_id=? AND lower(name) LIKE lower(?) ORDER BY name LIMIT 25", (interaction.guild_id, f"%{current}%"))
        return [app_commands.Choice(name=r["name"], value=r["name"]) for r in rows]

    @app_commands.command(name="relationship", description="Add or update an important adult/family relationship")
    @app_commands.autocomplete(child=child_auto)
    async def relationship(self, interaction: discord.Interaction, child: str, person_name: str, relationship_type: str,
                           familiarity: app_commands.Range[int,0,100]=70, closeness: app_commands.Range[int,0,100]=70,
                           trust: app_commands.Range[int,0,100]=70, authority: app_commands.Range[int,0,100]=50, notes: str|None=None):
        c = await self.bot.db.get_child(interaction.guild_id, child)
        if not c: return await interaction.response.send_message("Child not found.", ephemeral=True)
        old = await self.bot.db.fetchone("SELECT id FROM relationships WHERE child_id=? AND lower(person_name)=lower(?)", (c["id"],person_name))
        if old:
            await self.bot.db.execute("UPDATE relationships SET relationship_type=?,familiarity=?,closeness=?,trust=?,authority=?,notes=? WHERE id=?", (relationship_type,familiarity,closeness,trust,authority,notes,old["id"]))
        else:
            await self.bot.db.execute("INSERT INTO relationships(child_id,person_name,relationship_type,familiarity,closeness,trust,authority,notes) VALUES(?,?,?,?,?,?,?,?)", (c["id"],person_name,relationship_type,familiarity,closeness,trust,authority,notes))
        await interaction.response.send_message(f"👥 Saved **{child} ↔ {person_name}** ({relationship_type}).")

    @app_commands.command(name="peer", description="Connect two registered children as friends, siblings, rivals, crushes, etc.")
    @app_commands.autocomplete(child_a=child_auto, child_b=child_auto)
    async def peer(self, interaction: discord.Interaction, child_a: str, child_b: str, relationship_type: str,
                   closeness: app_commands.Range[int,0,100]=50, conflict: app_commands.Range[int,0,100]=10,
                   jealousy: app_commands.Range[int,0,100]=0, protectiveness: app_commands.Range[int,0,100]=0,
                   dynamic_notes: str|None=None):
        a = await self.bot.db.get_child(interaction.guild_id, child_a); b = await self.bot.db.get_child(interaction.guild_id, child_b)
        if not a or not b: return await interaction.response.send_message("I couldn't find both registered children.", ephemeral=True)
        if a["id"] == b["id"]: return await interaction.response.send_message("Choose two different children.", ephemeral=True)
        x,y = sorted((a["id"],b["id"]))
        old = await self.bot.db.fetchone("SELECT id FROM child_relationships WHERE guild_id=? AND child_a=? AND child_b=?", (interaction.guild_id,x,y))
        vals=(relationship_type,closeness,conflict,jealousy,protectiveness,dynamic_notes)
        if old:
            await self.bot.db.execute("UPDATE child_relationships SET relationship_type=?,closeness=?,conflict=?,jealousy=?,protectiveness=?,dynamic_notes=? WHERE id=?", (*vals,old["id"]))
        else:
            await self.bot.db.execute("INSERT INTO child_relationships(guild_id,child_a,child_b,relationship_type,closeness,conflict,jealousy,protectiveness,dynamic_notes) VALUES(?,?,?,?,?,?,?,?,?)", (interaction.guild_id,x,y,*vals))
        await interaction.response.send_message(f"🧩 Saved **{child_a} ↔ {child_b}** as **{relationship_type}**.")

    @app_commands.command(name="school-create", description="Create a school, daycare or preschool")
    async def school_create(self, interaction: discord.Interaction, name: str, school_type: str, start_time: str|None=None, end_time: str|None=None, environment: str|None=None, notes: str|None=None):
        try:
            await self.bot.db.execute("INSERT INTO schools(guild_id,name,type,start_time,end_time,environment,notes) VALUES(?,?,?,?,?,?,?)", (interaction.guild_id,name,school_type,start_time,end_time,environment,notes))
        except Exception:
            return await interaction.response.send_message("That school already exists or couldn't be created.", ephemeral=True)
        await interaction.response.send_message(f"🏫 Created **{name}** ({school_type}).")

    @app_commands.command(name="classroom-create", description="Create a classroom within a registered school")
    async def classroom_create(self, interaction: discord.Interaction, school_name: str, classroom_name: str, grade: str|None=None, teacher_name: str|None=None, teacher_style: str|None=None, notes: str|None=None):
        s = await self.bot.db.fetchone("SELECT id FROM schools WHERE guild_id=? AND lower(name)=lower(?)", (interaction.guild_id,school_name))
        if not s: return await interaction.response.send_message("School not found.", ephemeral=True)
        await self.bot.db.execute("INSERT INTO classrooms(school_id,name,grade,teacher_name,teacher_style,notes) VALUES(?,?,?,?,?,?)", (s["id"],classroom_name,grade,teacher_name,teacher_style,notes))
        await interaction.response.send_message(f"📝 Created **{classroom_name}** at **{school_name}**.")

    @app_commands.command(name="enroll", description="Enroll a registered child in a classroom")
    @app_commands.autocomplete(child=child_auto)
    async def enroll(self, interaction: discord.Interaction, child: str, school_name: str, classroom_name: str):
        c = await self.bot.db.get_child(interaction.guild_id, child)
        if not c: return await interaction.response.send_message("Child not found.", ephemeral=True)
        room = await self.bot.db.fetchone("""SELECT c.id classroom_id,s.id school_id FROM classrooms c JOIN schools s ON s.id=c.school_id
            WHERE s.guild_id=? AND lower(s.name)=lower(?) AND lower(c.name)=lower(?)""", (interaction.guild_id,school_name,classroom_name))
        if not room: return await interaction.response.send_message("School/classroom not found.", ephemeral=True)
        await self.bot.db.execute("INSERT INTO enrollments(child_id,classroom_id) VALUES(?,?) ON CONFLICT(child_id) DO UPDATE SET classroom_id=excluded.classroom_id", (c["id"],room["classroom_id"]))
        await interaction.response.send_message(f"🎒 Enrolled **{child}** in **{classroom_name}** at **{school_name}**.")

    @app_commands.command(name="location-create", description="Create a custom place such as Nana's house or dance studio")
    async def location_create(self, interaction: discord.Interaction, name: str, location_type: str, environment: str|None=None, rules_style: str|None=None, notes: str|None=None):
        try:
            await self.bot.db.execute("INSERT INTO locations(guild_id,name,type,environment,rules_style,notes) VALUES(?,?,?,?,?,?)", (interaction.guild_id,name,location_type,environment,rules_style,notes))
        except Exception:
            return await interaction.response.send_message("That location already exists.", ephemeral=True)
        await interaction.response.send_message(f"📍 Created **{name}**.")

    @app_commands.command(name="schedule-add", description="Add a recurring weekly place/activity to a child's world")
    @app_commands.autocomplete(child=child_auto)
    async def schedule_add(self, interaction: discord.Interaction, child: str, weekday: app_commands.Range[int,0,6], location_name: str, start_time: str, end_time: str, notes: str|None=None):
        c=await self.bot.db.get_child(interaction.guild_id,child)
        if not c:return await interaction.response.send_message("Child not found.",ephemeral=True)
        await self.bot.db.execute("INSERT INTO schedules(child_id,weekday,location_name,start_time,end_time,notes) VALUES(?,?,?,?,?,?)",(c["id"],weekday,location_name,start_time,end_time,notes))
        days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
        await interaction.response.send_message(f"📅 **{child}**: {days[weekday]} {start_time}–{end_time} at **{location_name}**.")

    @app_commands.command(name="routine-set", description="Save a routine as ordered steps separated by |")
    @app_commands.autocomplete(child=child_auto)
    async def routine_set(self, interaction: discord.Interaction, child: str, routine_name: str, steps: str, notes: str|None=None):
        c=await self.bot.db.get_child(interaction.guild_id,child)
        if not c:return await interaction.response.send_message("Child not found.",ephemeral=True)
        step_list=[x.strip() for x in steps.split("|") if x.strip()]
        await self.bot.db.execute("INSERT INTO routines(child_id,name,steps_json,notes) VALUES(?,?,?,?) ON CONFLICT(child_id,name) DO UPDATE SET steps_json=excluded.steps_json,notes=excluded.notes",(c["id"],routine_name,json.dumps(step_list),notes))
        await interaction.response.send_message(f"🛁 Saved **{routine_name}** for **{child}** with {len(step_list)} steps.")

    @app_commands.command(name="preference", description="Confirm a child's like or dislike as canon")
    @app_commands.autocomplete(child=child_auto)
    async def preference(self, interaction: discord.Interaction, child: str, category: str, item: str, preference_type: str):
        if preference_type not in ("like","dislike"): return await interaction.response.send_message("preference_type must be `like` or `dislike`.",ephemeral=True)
        c=await self.bot.db.get_child(interaction.guild_id,child)
        if not c:return await interaction.response.send_message("Child not found.",ephemeral=True)
        await self.bot.db.execute("INSERT INTO preferences(child_id,category,item,preference_type,confidence,confirmed) VALUES(?,?,?,?,100,1) ON CONFLICT(child_id,category,item,preference_type) DO UPDATE SET confidence=100,confirmed=1",(c["id"],category,item,preference_type))
        await interaction.response.send_message(f"💛 Canon: **{child}** {preference_type}s **{item}** ({category}).")

    @app_commands.command(name="group-create", description="Create a friend/social group")
    async def group_create(self, interaction: discord.Interaction, name: str, group_type: str="Friend Group", notes: str|None=None):
        try: await self.bot.db.execute("INSERT INTO groups_tbl(guild_id,name,type,notes) VALUES(?,?,?,?)",(interaction.guild_id,name,group_type,notes))
        except Exception:return await interaction.response.send_message("That group already exists.",ephemeral=True)
        await interaction.response.send_message(f"👯 Created **{name}**.")

    @app_commands.command(name="group-add", description="Add a registered child to a social group")
    @app_commands.autocomplete(child=child_auto)
    async def group_add(self, interaction: discord.Interaction, group_name: str, child: str):
        g=await self.bot.db.fetchone("SELECT id FROM groups_tbl WHERE guild_id=? AND lower(name)=lower(?)",(interaction.guild_id,group_name)); c=await self.bot.db.get_child(interaction.guild_id,child)
        if not g or not c:return await interaction.response.send_message("Group or child not found.",ephemeral=True)
        await self.bot.db.execute("INSERT OR IGNORE INTO group_members(group_id,child_id) VALUES(?,?)",(g["id"],c["id"]))
        await interaction.response.send_message(f"➕ Added **{child}** to **{group_name}**.")

async def setup(bot): await bot.add_cog(WorldCog(bot))
