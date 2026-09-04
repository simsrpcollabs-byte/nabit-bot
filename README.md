# KIDDO 🧸

KIDDO is an autonomous child behavior and development simulator for Discord roleplay servers. Register fictional children from birth through age 17, give them age-appropriate temperaments, traits, relationships, routines, schools and avatars, then let KIDDO decide how they behave.

This repository is the **JavaScript/Node.js version**. It is designed for Railway and uses `discord.js`.

## Core behavior

KIDDO treats user-entered profile information as canon. AI-generated behavior can create observations, but it does not silently rewrite permanent traits, milestones, relationships or preferences.

### Main commands

- `/kiddo register` — register a child/teen
- `/kiddo profile` — view their profile
- `/kiddo avatar` — upload/replace their avatar
- `/kiddo mood` — set temporary state
- `/kiddo react` — preview their likely reaction
- `/kiddo act` — KIDDO autonomously responds **as the child** using their name/avatar via webhook
- `/kiddo scenario` — generate an organic RP moment
- `/kiddo send` — simulate school/daycare/grandparents/etc. for a chosen duration
- `/kiddo day` — generate a broader day summary
- `/kiddo history` — see canon history + generated observations
- `/kiddo milestone` — log a confirmed milestone
- `/kiddo delete` — remove a profile

### Shared-world commands

Use `/kiddo-world` for:

- adult/caregiver relationships
- sibling/friend/rival/crush relationships between registered children
- schools and classrooms
- enrollment
- custom locations
- recurring schedules
- routines
- confirmed likes/dislikes
- friend/social groups

## Child proxy system

`/kiddo act` is fully autonomous. The user supplies only the situation/context. KIDDO chooses the child's words/actions based on age, temperament, traits, mood, relationships, history, school and preferences.

Proxy formatting:

- `*italics*` = action/nonverbal/internal response
- `**bold**` = audible dialogue

The proxy uses a Discord webhook so the message displays with the child's saved name and avatar.

## Discord permissions

KIDDO needs:

- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Application Commands
- **Manage Webhooks** for child proxy messages
- **Manage Channels** so it can create the private `#kiddo-assets` avatar-storage channel

Administrator is not required.

## Railway deployment

### 1. Replace the old Nabit repository

Delete the old Nabit source files from the repository and upload every file in this ZIP to the **repository root**.

### 2. Railway Variables

Set:

```env
DISCORD_TOKEN=your_kiddo_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
DATABASE_PATH=./kiddo.sqlite
```

Optional:

```env
DEV_GUILD_ID=your_test_server_id
```

`DEV_GUILD_ID` makes slash-command updates appear in that server almost immediately. Without it, KIDDO registers global commands.

### 3. Start command

Railway uses:

```text
npm start
```

No Python runtime is used.

### 4. Persistent database

Railway service files may be replaced on redeploy. For persistent child profiles, attach a Railway Volume and set `DATABASE_PATH` to a path on that volume, for example:

```env
DATABASE_PATH=/data/kiddo.sqlite
```

Mount the Railway Volume at `/data`.

### 5. Successful logs

You should eventually see:

```text
Synced KIDDO global slash commands.
KIDDO online as KIDDO#0000 (...)
```

or, with a dev guild:

```text
Synced KIDDO commands to dev guild ...
KIDDO online as KIDDO#0000 (...)
```

## Discord application identity

The bot's visible Discord name/avatar come from the Discord application attached to `DISCORD_TOKEN`, not from this repo. If Railway still uses Nabit's token, Discord will still show Nabit. Replace the Railway `DISCORD_TOKEN` with KIDDO's token or rename the existing Discord application.

## AI model

The default is `gpt-5.6-luna`, a cost-sensitive GPT-5.6 model suitable for higher-volume narrative generation. You can change `OPENAI_MODEL` in Railway Variables.

### Age-based temperament picker
During `/kiddo register`, enter `age_months` first. The `primary_temperament` and `secondary_temperament` fields then show selectable Discord autocomplete options for that child's developmental stage. You do not need to type temperament labels manually.
