# Nabit Complete v5

This is the full drop-in update.

## Full user flow

`/nabit`
→ enter **name + delivery location**
→ Nabit home
→ browse one of the 5 launch businesses
→ choose category
→ add items
→ view bag
→ remove items / add more / clear bag
→ optional restaurant note
→ **Generate Checkout**
→ bot renders the actual branded Nabit checkout PNG
→ **Place Order**
→ bot renders a second branded **Order Confirmed** PNG
→ order appears in **Your Orders**

## Launch businesses included

1. Crunch
2. The Swan's Nest
3. Nessa's Confections
4. Gabrie's Dominican Soul
5. Aguilar Convenience

## Files

Upload all of these FLAT into the root of the GitHub repo and replace older versions:

- `index.js`
- `data.js`
- `renderer.js`
- `package.json`
- `.env.example`
- `README.md`

Keep your Railway variables:
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`

## Important

- The generated images are deterministic SVG/PNG renders using Sharp. No AI generation happens in the Discord bot.
- Cart/order/session data is still in memory for now, so Railway restarts clear it.
- The next major update should move sessions/orders/menus into Supabase for persistence.
- Aguilar Convenience currently uses starter convenience-store prices, editable in `data.js`.
