import discord

BRAND = 0xF4B942

def behavior_embed(result: dict) -> discord.Embed:
    embed = discord.Embed(title=result.get("title") or "KIDDO", description=result.get("narrative") or "", color=BRAND)
    if result.get("overall"):
        embed.add_field(name="Overall", value=result["overall"], inline=True)
    if result.get("pickup_state"):
        embed.add_field(name="Return/Pickup", value=result["pickup_state"], inline=True)
    notable = result.get("notable") or []
    if notable:
        embed.add_field(name="Notable", value="\n".join(f"• {x}" for x in notable[:3]), inline=False)
    embed.set_footer(text="KIDDO • Generated behavior is not permanent canon unless you confirm it.")
    return embed

def profile_embed(child: dict) -> discord.Embed:
    from utils import age_label
    e = discord.Embed(title=f"🧸 {child['name']}", description=child.get("notes") or "No custom behavior notes yet.", color=BRAND)
    temps = child["primary_temperament"] + (f" + {child['secondary_temperament']}" if child.get("secondary_temperament") else "")
    e.add_field(name="Age", value=f"{age_label(child['age_months'])} • {child['stage']}")
    e.add_field(name="Temperament", value=temps)
    e.add_field(name="Mood", value=child.get("current_mood", "Normal"))
    e.add_field(name="Traits", value=", ".join(child.get("traits", [])) or "None set", inline=False)
    if child.get("school"):
        s = child["school"]
        e.add_field(name="School", value=f"{s['school_name']} • {s.get('classroom_name') or s.get('grade') or ''}", inline=False)
    return e
