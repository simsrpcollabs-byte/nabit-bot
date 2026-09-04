import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { KiddoDatabase } from "./database.js";
import { BehaviorEngine } from "./behavior.js";
import { kiddoCommand, handleKiddo } from "./commands.js";
import { worldCommand, handleWorld } from "./worldCommands.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN is missing. Add it in Railway Variables.");

const db = new KiddoDatabase(process.env.DATABASE_PATH || "./kiddo.sqlite");
const behavior = new BehaviorEngine(process.env.OPENAI_API_KEY || "", process.env.OPENAI_MODEL || "gpt-5.6-luna");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    const rest = new REST({ version: "10" }).setToken(token);
    const commands = [kiddoCommand.toJSON(), worldCommand.toJSON()];
    if (process.env.DEV_GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.DEV_GUILD_ID), { body: commands });
      console.log(`Synced KIDDO commands to dev guild ${process.env.DEV_GUILD_ID}.`);
    } else {
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log("Synced KIDDO global slash commands.");
    }
    console.log(`KIDDO online as ${client.user.tag} (${client.user.id})`);
  } catch (err) {
    console.error("Command sync failed:", err);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused();
      const names = db.childNames(interaction.guildId, focused).slice(0, 25);
      return interaction.respond(names.map(name => ({ name, value: name })));
    }
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "kiddo") return await handleKiddo(interaction, db, behavior);
    if (interaction.commandName === "kiddo-world") return await handleWorld(interaction, db);
  } catch (err) {
    console.error(err);
    const msg = { content: `KIDDO error: ${err.message || "Something went wrong."}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(msg).catch(() => {});
    else await interaction.reply(msg).catch(() => {});
  }
});

client.login(token);
