import { SlashCommandBuilder } from "discord.js";
import { AGE_GROUPS, TEMPERAMENTS, MOODS, DESTINATIONS, SUMMARY_STYLES } from "./constants.js";
import { ageMonthsFromSelection } from "./utils.js";
import { behaviorEmbed, profileEmbed } from "./ui.js";
import { storeAvatar, resolveAvatarUrl, sendAsChild } from "./proxy.js";

const kiddo = new SlashCommandBuilder()
  .setName("kiddo")
  .setDescription("Child and teen behavior simulator")
  .addSubcommand(s => s.setName("register").setDescription("Register a child or teen")
    .addStringOption(o => o.setName("name").setDescription("Character name").setRequired(true))
    .addStringOption(o => o.setName("age_group").setDescription("Choose the child's developmental age group").setRequired(true).addChoices(...Object.keys(AGE_GROUPS).map(x => ({ name: x, value: x }))))
    .addStringOption(o => o.setName("age").setDescription("Choose the child's age").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("primary_temperament").setDescription("Choose an age-appropriate temperament").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("traits").setDescription("1-5 comma-separated traits").setRequired(true))
    .addStringOption(o => o.setName("secondary_temperament").setDescription("Optional second age-appropriate temperament").setAutocomplete(true))
    .addStringOption(o => o.setName("notes").setDescription("Behavior quirks and canon notes"))
    .addStringOption(o => o.setName("birthday").setDescription("Optional YYYY-MM-DD"))
    .addStringOption(o => o.setName("pronouns").setDescription("Optional pronouns")))
  .addSubcommand(s => s.setName("profile").setDescription("View a child profile").addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true)))
  .addSubcommand(s => s.setName("avatar").setDescription("Upload or replace a child's avatar")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addAttachmentOption(o => o.setName("image").setDescription("Avatar image").setRequired(true)))
  .addSubcommand(s => s.setName("mood").setDescription("Set a child's temporary mood/state")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("mood").setDescription("Current mood/state").setRequired(true).addChoices(...MOODS.map(x => ({ name: x, value: x })))))
  .addSubcommand(s => s.setName("react").setDescription("Preview how a child would react")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("situation").setDescription("What just happened?").setRequired(true)))
  .addSubcommand(s => s.setName("act").setDescription("Autonomously act as the child in the current RP channel")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("situation").setDescription("What is happening around the child?").setRequired(true)))
  .addSubcommand(s => s.setName("scenario").setDescription("Generate a behavior-based scenario")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("context").setDescription("Optional setting/context")))
  .addSubcommand(s => s.setName("day").setDescription("Generate a day-in-the-life summary")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("detail").setDescription("Summary detail").addChoices(...SUMMARY_STYLES.map(x => ({ name: x, value: x })))))
  .addSubcommand(s => s.setName("send").setDescription("Simulate time at school, daycare, grandparents, etc.")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("destination").setDescription("Where are they going?").setRequired(true).addChoices(...DESTINATIONS.map(x => ({ name: x, value: x }))))
    .addNumberOption(o => o.setName("hours").setDescription("Duration in hours").setMinValue(0.5).setMaxValue(48).setRequired(true))
    .addStringOption(o => o.setName("detail").setDescription("Summary detail").addChoices(...SUMMARY_STYLES.map(x => ({ name: x, value: x }))))
    .addStringOption(o => o.setName("notes").setDescription("Drop-off mood, who is there, special context, etc.")))
  .addSubcommand(s => s.setName("history").setDescription("View recent history and observations").addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true)))
  .addSubcommand(s => s.setName("milestone").setDescription("Log a confirmed milestone as canon")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("milestone").setDescription("What happened?").setRequired(true)))
  .addSubcommand(s => s.setName("delete").setDescription("Delete a registered child")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true)));

export const kiddoCommand = kiddo;

async function getChild(interaction, db, name) {
  const child = db.getChild(interaction.guildId, name);
  if (!child) await interaction.editReply({ content: `I can't find **${name}** in this server's KIDDO registry.` });
  return child;
}

export async function handleKiddo(interaction, db, behavior) {
  const sub = interaction.options.getSubcommand();
  if (sub === "register") {
    const name = interaction.options.getString("name", true);
    const stage = interaction.options.getString("age_group", true);
    const ageValue = interaction.options.getString("age", true);
    if (!AGE_GROUPS[stage]?.includes(ageValue)) return interaction.reply({ content: `Choose an age from the **${stage}** age list.`, ephemeral: true });
    const ageMonths = ageMonthsFromSelection(stage, ageValue);
    const primary = interaction.options.getString("primary_temperament", true);
    const secondary = interaction.options.getString("secondary_temperament");
    const allowed = TEMPERAMENTS[stage];
    if (!allowed.includes(primary) || (secondary && !allowed.includes(secondary))) return interaction.reply({ content: `For **${stage}**, use: ${allowed.join(", ")}`, ephemeral: true });
    const traits = interaction.options.getString("traits", true).split(",").map(x => x.trim()).filter(Boolean).slice(0, 5);
    if (!traits.length) return interaction.reply({ content: "Give me 1-5 comma-separated traits.", ephemeral: true });
    if (db.getChild(interaction.guildId, name)) return interaction.reply({ content: `**${name}** is already registered.`, ephemeral: true });
    const birthday = interaction.options.getString("birthday");
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return interaction.reply({ content: "Birthday must be `YYYY-MM-DD`.", ephemeral: true });
    db.addChild({ guildId: interaction.guildId, createdBy: interaction.user.id, name, ageMonths, stage, primaryTemperament: primary, secondaryTemperament: secondary, traits, notes: interaction.options.getString("notes"), birthday, pronouns: interaction.options.getString("pronouns") });
    const child = db.getChild(interaction.guildId, name);
    return interaction.reply({ embeds: [profileEmbed(child)] });
  }

  await interaction.deferReply({ ephemeral: ["avatar", "act"].includes(sub) });
  const name = interaction.options.getString("child", true);
  const child = await getChild(interaction, db, name);
  if (!child) return;

  if (sub === "profile") return interaction.editReply({ embeds: [profileEmbed(child, await resolveAvatarUrl(interaction.guild, child))] });
  if (sub === "avatar") {
    try {
      const url = await storeAvatar(interaction, db, child, interaction.options.getAttachment("image", true));
      return interaction.editReply({ content: `🖼️ Saved **${child.name}**'s avatar.`, embeds: [profileEmbed(db.getChild(interaction.guildId, name), url)] });
    } catch (e) { return interaction.editReply({ content: `Avatar error: ${e.message}` }); }
  }
  if (sub === "mood") {
    const mood = interaction.options.getString("mood", true);
    db.run("UPDATE children SET current_mood=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", [mood, child.id]);
    return interaction.editReply(`🎭 **${child.name}** is now **${mood}**.`);
  }
  if (sub === "react") {
    const result = await behavior.generate(child, "Determine the child's immediate realistic reaction.", interaction.options.getString("situation", true), "Standard");
    db.logObservations(child.id, "react", result.observations);
    return interaction.editReply({ embeds: [behaviorEmbed(result)] });
  }
  if (sub === "act") {
    const result = await behavior.proxy(child, interaction.options.getString("situation", true));
    db.logObservations(child.id, "act", result.observations);
    try {
      await sendAsChild(interaction, child, result.content, await resolveAvatarUrl(interaction.guild, child));
      return interaction.editReply({ content: `🧸 **${child.name}** responded in ${interaction.channel}.` });
    } catch (e) { return interaction.editReply({ content: `Proxy error: ${e.message}. Make sure KIDDO has **Manage Webhooks** in this channel.` }); }
  }
  if (sub === "scenario") {
    const result = await behavior.generate(child, "Generate one organic age-appropriate RP situation centered on this child and show how they behave.", interaction.options.getString("context") || "", "Standard");
    db.logObservations(child.id, "scenario", result.observations);
    return interaction.editReply({ embeds: [behaviorEmbed(result)] });
  }
  if (sub === "day") {
    const detail = interaction.options.getString("detail") || "Standard";
    const result = await behavior.generate(child, "Simulate this child's general day using their routines, schedule, relationships, school and current mood. Do not force drama.", "", detail);
    db.logObservations(child.id, "day", result.observations);
    return interaction.editReply({ embeds: [behaviorEmbed(result)] });
  }
  if (sub === "send") {
    const destination = interaction.options.getString("destination", true);
    const hours = interaction.options.getNumber("hours", true);
    const detail = interaction.options.getString("detail") || "Standard";
    const notes = interaction.options.getString("notes") || "";
    const result = await behavior.generate(child, `Simulate ${hours} hours away at ${destination}. Include age-appropriate arrival/drop-off, activities, social behavior, needs/transitions and return/pickup when relevant.`, notes, detail);
    db.logObservations(child.id, `send:${destination}`, result.observations);
    return interaction.editReply({ embeds: [behaviorEmbed(result)] });
  }
  if (sub === "history") {
    const history = db.all("SELECT event_type,description,canon_status,happened_at FROM history WHERE child_id=? ORDER BY happened_at DESC LIMIT 10", [child.id]);
    const obs = db.all("SELECT category,observation,confidence,created_at FROM observations WHERE child_id=? ORDER BY created_at DESC LIMIT 10", [child.id]);
    const lines = [...history.map(x => `**${x.event_type}** (${x.canon_status}) — ${x.description}`), ...obs.map(x => `_${x.category} observation ${x.confidence}%_ — ${x.observation}`)].slice(0, 15);
    return interaction.editReply(lines.length ? lines.join("\n") : `No history recorded for **${child.name}** yet.`);
  }
  if (sub === "milestone") {
    const milestone = interaction.options.getString("milestone", true);
    db.run("INSERT INTO history(child_id,event_type,description,canon_status) VALUES(?,?,?,'canon')", [child.id, "Milestone", milestone]);
    return interaction.editReply(`🌱 Logged **${child.name}**'s milestone: ${milestone}`);
  }
  if (sub === "delete") {
    db.run("DELETE FROM children WHERE id=?", [child.id]);
    return interaction.editReply(`🗑️ Removed **${child.name}** from KIDDO.`);
  }
}
