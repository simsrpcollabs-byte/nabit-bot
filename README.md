# Nabit v6 — Public Receipt Edition

This is the complete update that removes generated PNGs.

## New flow

`/nabit`
→ enter name + delivery location
→ browse privately
→ add items privately
→ review bag privately
→ confirm order
→ Nabit posts a **public receipt-style text block in the channel**

The final receipt looks like a real printed receipt, similar to the Discord example you provided.

## Important behavior

- Shopping/browsing remains **ephemeral/private**
- The **final receipt is public**
- No `sharp`
- No PNG generation
- No image rendering
- Faster/lighter Railway builds

## Included businesses

1. Crunch
2. The Swan's Nest
3. Nessa's Confections
4. Gabrie's Dominican Soul
5. Aguilar Convenience

## Upload

Upload these files FLAT to the root of your GitHub repo:

- `index.js`
- `data.js`
- `package.json`
- `.env.example`
- `README.md`

Delete the old `renderer.js` from GitHub because v6 does not use it.

Keep your existing Railway variables:
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`

## Discord permission needed

Nabit must have **Send Messages** permission in any channel where you want public receipts posted.

## Current persistence

Sessions, carts, and orders are still stored in memory and reset when Railway restarts. Supabase can be added next for permanent order history.
