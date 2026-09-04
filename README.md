# KIDDO

KIDDO is a Discord roleplay bot that simulates believable behavior for fictional children and teens from birth through age 17.

It uses a deterministic SQLite profile/world model for canon and an OpenAI model only for narrative behavior generation.

## What is included

### Child behavior
- `/kiddo register`
- `/kiddo profile`
- `/kiddo avatar` — upload/replace the child's avatar
- `/kiddo act` — AI decides the child's in-character response and proxies it
- `/kiddo edit`
- `/kiddo ageup`
- `/kiddo mood`
- `/kiddo react`
- `/kiddo scenario`
- `/kiddo send`
- `/kiddo day`
- `/kiddo history`
- `/kiddo milestone`

### World building / v2
- `/world relationship` — important adults/family
- `/world peer` — sibling, friend, rival, crush, etc. between registered kids
- `/world school-create`
- `/world classroom-create`
- `/world enroll`
- `/world location-create`
- `/world schedule-add`
- `/world routine-set`
- `/world preference`
- `/world group-create`
- `/world group-add`

## Canon model
KIDDO intentionally separates:

1. **Canon** — explicitly entered/confirmed by the user.
2. **Observed behavior** — generated during a scene/day.
3. **Suggested development** — patterns KIDDO may surface for later confirmation.

Generated behavior does not silently rewrite a child profile.

## Requirements
- Python 3.11+
- Discord bot token
- OpenAI API key for AI behavior generation

## Windows setup

Open PowerShell in this folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
py main.py
```

Fill `.env` with:

```env
DISCORD_TOKEN=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
DATABASE_PATH=./kiddo.sqlite
DEV_GUILD_ID=YOUR_TEST_SERVER_ID
```

`DEV_GUILD_ID` is optional but strongly recommended while building because guild-scoped commands update quickly. Remove it later if you want global commands.

## Discord bot setup

When inviting KIDDO, include both the `bot` and `applications.commands` scopes. Slash commands must be synced before Discord displays them; this project syncs during startup.

The bot only needs basic permissions to send messages and embeds for this version.

## Registering a child

Age is stored in **months**, which lets KIDDO distinguish an 8-month-old from an 18-month-old.

Examples:
- newborn: `0`
- 8 months: `8`
- 2 years: `24`
- 5 years: `60`
- 16 years: `192`

Choose age-appropriate temperament names from `constants.py`.

Example:

```text
/kiddo register
name: Preston
age_months: 11
primary_temperament: Curious Baby
secondary_temperament: Easy Baby
traits: Curious, Affectionate, Observant, Silly
notes: Loves opening cabinets and watching adults. Usually cheerful after naps.
```

## Sending a child somewhere

```text
/kiddo send
name: Preston
destination: Grandma Elaine
hours: 4
detail: Standard
starting_context: Well rested; had lunch before drop-off.
```

The AI receives the child's registered temperament, traits, mood, relationships, known preferences, recent history, temporary effects, school details and weekly schedule.

## Build philosophy

The database is the source of truth. AI text is never treated as the source of truth.

This prevents common RP-bot problems such as:
- personality drift
- invented milestones becoming canon
- a shy child becoming permanently outgoing after one scene
- inconsistent sibling/friend relationships
- toddlers suddenly speaking like adults

## Database

SQLite is created automatically at the configured `DATABASE_PATH`.

The schema includes:
- children
- traits and behavior scales
- family/adult relationships
- child-to-child relationships
- schools/classrooms/enrollment
- social groups
- preferences
- history
- observations
- temporary effects
- locations
- weekly schedules
- routines

## Recommended next UI upgrades

The backend supports the important world data already. The next polish pass would replace some text parameters with Discord buttons/select menus/modals, especially registration, temperament selection, history confirmation and school setup.

## Child avatars + RP proxying

KIDDO can post directly in RP channels as each registered child using Discord webhooks.

### Upload an avatar

```text
/kiddo avatar
name: Preston
image: [upload PNG/JPG/WEBP/GIF]
```

On the first avatar upload, KIDDO creates a private `#kiddo-assets` channel to keep avatar attachments persistent. The channel is hidden from `@everyone` by default.

### Let KIDDO act as the child autonomously

Use `/kiddo act` when you want KIDDO to determine the child's response. You provide only what happened around the child; KIDDO writes the child's actions, vocalizations, and dialogue itself:

```text
/kiddo act
name: Preston
situation: Wren puts him down in the playpen and walks toward the kitchen.
direction: React naturally. He skipped his afternoon nap.
```

KIDDO uses the child's age, developmental stage, temperament, traits, current mood, relationships, preferences, recent history, and other registered world data. It then posts the result directly as that child.

Proxy RP formatting follows the same convention throughout KIDDO:

- `*italics*` = actions, nonverbal behavior, or internal reaction
- `**bold**` = audible dialogue/vocalization

Generated proxy behavior is still only an **observation**. It does not silently become permanent canon.

### Discord permissions for proxy features

In addition to normal message permissions, KIDDO needs:

- **Manage Webhooks** — required to post under each child's name/avatar.
- **Manage Channels** — used to create the private `#kiddo-assets` storage channel the first time an avatar is uploaded.
- **Attach Files**
- **Read Message History**

KIDDO does not need Administrator permission.
