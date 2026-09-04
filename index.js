import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { KiddoDatabase } from "./database.js";
import { BehaviorEngine } from "./behavior.js";
import { kiddoCommand, handleKiddo } from "./commands.js";
import { worldCommand, handleWorld } from "./worldCommands.js";
import { AGE_GROUPS, TEMPERAMENTS } from "./constants.js";

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
      const focused = interaction.options.getFocused(true);

      if (focused.name === "age") {
        const stage = interaction.options.getString("age_group");
        if (!stage || !AGE_GROUPS[stage]) {
          return interaction.respond([{ name: "Choose age_group first", value: "Choose age_group first" }]);
        }
        const query = String(focused.value || "").toLowerCase();
        return interaction.respond(AGE_GROUPS[stage]
          .filter(age => age.toLowerCase().includes(query))
          .slice(0, 25)
          .map(age => ({ name: age, value: age })));
      }

      if (["primary_temperament", "secondary_temperament"].includes(focused.name)) {
        const stage = interaction.options.getString("age_group");
        if (!stage || !TEMPERAMENTS[stage]) {
          return interaction.respond([{ name: "Choose age_group first", value: "Choose age_group first" }]);
        }

        const primary = interaction.options.getString("primary_temperament");
        const query = String(focused.value || "").toLowerCase();
        const options = (TEMPERAMENTS[stage] || [])
          .filter(name => focused.name !== "secondary_temperament" || name !== primary)
          .filter(name => name.toLowerCase().includes(query))
          .slice(0, 25)
          .map(name => ({ name, value: name }));

        return interaction.respond(options);
      }

      const names = db.childNames(interaction.guildId, String(focused.value || "")).slice(0, 25);
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
