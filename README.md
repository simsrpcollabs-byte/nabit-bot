# Nabit UI v2

This version is styled around the actual Nabit brand system:

- Bright Grape `#7257E8`
- Lemon Yellow `#F8DD57`
- Soft Lilac `#E7E0FF`
- Cream `#FFF9EE`
- Ink `#24212C`
- Tagline: **Need it? Nabit.**

## What works now

- `/nabit` branded home screen
- Browse Restaurants
- Search modal
- Favorites
- Bag
- Checkout screen
- Pay/confirm button
- Order confirmation
- Order tracking shell
- Order details
- Private/ephemeral Nabit app experience

## Important

There are intentionally **no fake restaurants** in this build. The Browse and Search screens are ready for your real RP restaurants.

The cart/order storage is currently temporary memory, so it resets when Railway restarts. Supabase comes next after we approve the ordering flow.

## Upload

Upload these files flat to the root of your GitHub repo and replace the older versions:

- `index.js`
- `package.json`
- `.env.example`
- `README.md`

Keep your existing Railway variables:
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`

Railway should redeploy automatically after the GitHub commit.
