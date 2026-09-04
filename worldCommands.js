import { SlashCommandBuilder } from "discord.js";

const world = new SlashCommandBuilder().setName("kiddo-world").setDescription("Manage KIDDO's shared RP world")
  .addSubcommand(s => s.setName("adult").setDescription("Save a child's relationship with an adult/caregiver")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("person").setDescription("Adult/caregiver name").setRequired(true))
    .addStringOption(o => o.setName("relationship").setDescription("Parent, Grandma, Nanny, etc.").setRequired(true))
    .addIntegerOption(o => o.setName("closeness").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addIntegerOption(o => o.setName("authority").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addStringOption(o => o.setName("notes").setDescription("Dynamic notes")))
  .addSubcommand(s => s.setName("peer").setDescription("Connect two registered children")
    .addStringOption(o => o.setName("child_a").setDescription("First child").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("child_b").setDescription("Second child").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("relationship").setDescription("Sibling, best friend, rival, crush, etc.").setRequired(true))
    .addIntegerOption(o => o.setName("closeness").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addIntegerOption(o => o.setName("conflict").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addIntegerOption(o => o.setName("jealousy").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addIntegerOption(o => o.setName("protectiveness").setDescription("0-100").setMinValue(0).setMaxValue(100))
    .addStringOption(o => o.setName("notes").setDescription("Dynamic notes")))
  .addSubcommand(s => s.setName("school-create").setDescription("Create a school/daycare/preschool")
    .addStringOption(o => o.setName("name").setDescription("School name").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Daycare, preschool, elementary, etc.").setRequired(true))
    .addStringOption(o => o.setName("environment").setDescription("School vibe/environment"))
    .addStringOption(o => o.setName("notes").setDescription("Notes")))
  .addSubcommand(s => s.setName("classroom-create").setDescription("Create a classroom")
    .addStringOption(o => o.setName("school").setDescription("School name").setRequired(true))
    .addStringOption(o => o.setName("classroom").setDescription("Classroom name").setRequired(true))
    .addStringOption(o => o.setName("grade").setDescription("Grade"))
    .addStringOption(o => o.setName("teacher").setDescription("Teacher name"))
    .addStringOption(o => o.setName("teacher_style").setDescription("Warm, strict, playful, etc.")))
  .addSubcommand(s => s.setName("enroll").setDescription("Enroll a registered child")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("school").setDescription("School name").setRequired(true))
    .addStringOption(o => o.setName("classroom").setDescription("Classroom name").setRequired(true)))
  .addSubcommand(s => s.setName("location-create").setDescription("Create a custom place")
    .addStringOption(o => o.setName("name").setDescription("Location name").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Grandparent house, studio, etc.").setRequired(true))
    .addStringOption(o => o.setName("environment").setDescription("Environment"))
    .addStringOption(o => o.setName("rules").setDescription("Strict, lenient, structured, etc."))
    .addStringOption(o => o.setName("notes").setDescription("Notes")))
  .addSubcommand(s => s.setName("schedule-add").setDescription("Add a recurring weekly activity")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addIntegerOption(o => o.setName("weekday").setDescription("0=Mon through 6=Sun").setMinValue(0).setMaxValue(6).setRequired(true))
    .addStringOption(o => o.setName("location").setDescription("Place/activity").setRequired(true))
    .addStringOption(o => o.setName("start").setDescription("Start time").setRequired(true))
    .addStringOption(o => o.setName("end").setDescription("End time").setRequired(true))
    .addStringOption(o => o.setName("notes").setDescription("Notes")))
  .addSubcommand(s => s.setName("routine-set").setDescription("Save a routine; separate steps with |")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("name").setDescription("Routine name").setRequired(true))
    .addStringOption(o => o.setName("steps").setDescription("Bath | pajamas | story | bed").setRequired(true))
    .addStringOption(o => o.setName("notes").setDescription("Notes")))
  .addSubcommand(s => s.setName("preference").setDescription("Confirm a like/dislike as canon")
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true))
    .addStringOption(o => o.setName("category").setDescription("Food, music, toy, subject, etc.").setRequired(true))
    .addStringOption(o => o.setName("item").setDescription("Preference item").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Like or dislike").setRequired(true).addChoices({ name: "Like", value: "like" }, { name: "Dislike", value: "dislike" })))
  .addSubcommand(s => s.setName("group-create").setDescription("Create a social/friend group")
    .addStringOption(o => o.setName("name").setDescription("Group name").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Friend Group, Lunch Table, etc."))
    .addStringOption(o => o.setName("notes").setDescription("Notes")))
  .addSubcommand(s => s.setName("group-add").setDescription("Add a child to a group")
    .addStringOption(o => o.setName("group").setDescription("Group name").setRequired(true))
    .addStringOption(o => o.setName("child").setDescription("Child name").setAutocomplete(true).setRequired(true)));

export const worldCommand = world;

export async function handleWorld(interaction, db) {
  const sub = interaction.options.getSubcommand();
  const getChild = name => db.getChild(interaction.guildId, name);

  if (sub === "adult") {
    const c = getChild(interaction.options.getString("child", true)); if (!c) return interaction.reply({ content: "Child not found.", ephemeral: true });
    const person = interaction.options.getString("person", true); const rel = interaction.options.getString("relationship", true);
    const close = interaction.options.getInteger("closeness") ?? 50, auth = interaction.options.getInteger("authority") ?? 50, notes = interaction.options.getString("notes");
    const old = db.get("SELECT id FROM relationships WHERE child_id=? AND lower(person_name)=lower(?)", [c.id, person]);
    if (old) db.run("UPDATE relationships SET relationship_type=?,closeness=?,authority=?,notes=? WHERE id=?", [rel, close, auth, notes, old.id]);
    else db.run("INSERT INTO relationships(child_id,person_name,relationship_type,closeness,authority,notes) VALUES(?,?,?,?,?,?)", [c.id, person, rel, close, auth, notes]);
    return interaction.reply(`👥 Saved **${c.name} ↔ ${person}** (${rel}).`);
  }
  if (sub === "peer") {
    const a = getChild(interaction.options.getString("child_a", true)), b = getChild(interaction.options.getString("child_b", true));
    if (!a || !b || a.id === b.id) return interaction.reply({ content: "Choose two different registered children.", ephemeral: true });
    const [x, y] = [a.id, b.id].sort((m,n) => m-n);
    const vals = [interaction.options.getString("relationship", true), interaction.options.getInteger("closeness") ?? 50, interaction.options.getInteger("conflict") ?? 10, interaction.options.getInteger("jealousy") ?? 0, interaction.options.getInteger("protectiveness") ?? 0, interaction.options.getString("notes")];
    const old = db.get("SELECT id FROM child_relationships WHERE guild_id=? AND child_a=? AND child_b=?", [interaction.guildId,x,y]);
    if (old) db.run("UPDATE child_relationships SET relationship_type=?,closeness=?,conflict=?,jealousy=?,protectiveness=?,dynamic_notes=? WHERE id=?", [...vals, old.id]);
    else db.run("INSERT INTO child_relationships(guild_id,child_a,child_b,relationship_type,closeness,conflict,jealousy,protectiveness,dynamic_notes) VALUES(?,?,?,?,?,?,?,?,?)", [interaction.guildId,x,y,...vals]);
    return interaction.reply(`🧩 Saved **${a.name} ↔ ${b.name}** as **${vals[0]}**.`);
  }
  if (sub === "school-create") {
    try { db.run("INSERT INTO schools(guild_id,name,type,environment,notes) VALUES(?,?,?,?,?)", [interaction.guildId, interaction.options.getString("name",true), interaction.options.getString("type",true), interaction.options.getString("environment"), interaction.options.getString("notes")]); }
    catch { return interaction.reply({ content: "That school already exists or couldn't be created.", ephemeral: true }); }
    return interaction.reply("🏫 School created.");
  }
  if (sub === "classroom-create") {
    const school = db.get("SELECT id FROM schools WHERE guild_id=? AND lower(name)=lower(?)", [interaction.guildId, interaction.options.getString("school",true)]);
    if (!school) return interaction.reply({ content: "School not found.", ephemeral: true });
    db.run("INSERT INTO classrooms(school_id,name,grade,teacher_name,teacher_style) VALUES(?,?,?,?,?)", [school.id, interaction.options.getString("classroom",true), interaction.options.getString("grade"), interaction.options.getString("teacher"), interaction.options.getString("teacher_style")]);
    return interaction.reply("📝 Classroom created.");
  }
  if (sub === "enroll") {
    const c = getChild(interaction.options.getString("child",true)); if (!c) return interaction.reply({ content: "Child not found.", ephemeral:true });
    const room = db.get(`SELECT c.id classroom_id FROM classrooms c JOIN schools s ON s.id=c.school_id WHERE s.guild_id=? AND lower(s.name)=lower(?) AND lower(c.name)=lower(?)`, [interaction.guildId, interaction.options.getString("school",true), interaction.options.getString("classroom",true)]);
    if (!room) return interaction.reply({ content: "School/classroom not found.", ephemeral:true });
    db.run("INSERT INTO enrollments(child_id,classroom_id) VALUES(?,?) ON CONFLICT(child_id) DO UPDATE SET classroom_id=excluded.classroom_id", [c.id, room.classroom_id]);
    return interaction.reply(`🎒 Enrolled **${c.name}**.`);
  }
  if (sub === "location-create") {
    try { db.run("INSERT INTO locations(guild_id,name,type,environment,rules_style,notes) VALUES(?,?,?,?,?,?)", [interaction.guildId, interaction.options.getString("name",true), interaction.options.getString("type",true), interaction.options.getString("environment"), interaction.options.getString("rules"), interaction.options.getString("notes")]); }
    catch { return interaction.reply({ content:"That location already exists.", ephemeral:true }); }
    return interaction.reply("📍 Location created.");
  }
  if (sub === "schedule-add") {
    const c = getChild(interaction.options.getString("child",true)); if (!c) return interaction.reply({content:"Child not found.",ephemeral:true});
    db.run("INSERT INTO schedules(child_id,weekday,location_name,start_time,end_time,notes) VALUES(?,?,?,?,?,?)", [c.id, interaction.options.getInteger("weekday",true), interaction.options.getString("location",true), interaction.options.getString("start",true), interaction.options.getString("end",true), interaction.options.getString("notes")]);
    return interaction.reply(`📅 Added to **${c.name}**'s schedule.`);
  }
  if (sub === "routine-set") {
    const c = getChild(interaction.options.getString("child",true)); if (!c) return interaction.reply({content:"Child not found.",ephemeral:true});
    const steps = interaction.options.getString("steps",true).split("|").map(x=>x.trim()).filter(Boolean);
    db.run("INSERT INTO routines(child_id,name,steps_json,notes) VALUES(?,?,?,?) ON CONFLICT(child_id,name) DO UPDATE SET steps_json=excluded.steps_json,notes=excluded.notes", [c.id, interaction.options.getString("name",true), JSON.stringify(steps), interaction.options.getString("notes")]);
    return interaction.reply(`🛁 Routine saved for **${c.name}**.`);
  }
  if (sub === "preference") {
    const c = getChild(interaction.options.getString("child",true)); if (!c) return interaction.reply({content:"Child not found.",ephemeral:true});
    db.run("INSERT INTO preferences(child_id,category,item,preference_type,confidence,confirmed) VALUES(?,?,?,?,100,1) ON CONFLICT(child_id,category,item,preference_type) DO UPDATE SET confidence=100,confirmed=1", [c.id, interaction.options.getString("category",true), interaction.options.getString("item",true), interaction.options.getString("type",true)]);
    return interaction.reply(`💛 Canon preference saved for **${c.name}**.`);
  }
  if (sub === "group-create") {
    try { db.run("INSERT INTO groups_tbl(guild_id,name,type,notes) VALUES(?,?,?,?)", [interaction.guildId, interaction.options.getString("name",true), interaction.options.getString("type") || "Friend Group", interaction.options.getString("notes")]); }
    catch { return interaction.reply({content:"That group already exists.",ephemeral:true}); }
    return interaction.reply("👯 Group created.");
  }
  if (sub === "group-add") {
    const c = getChild(interaction.options.getString("child",true)), g = db.get("SELECT id FROM groups_tbl WHERE guild_id=? AND lower(name)=lower(?)", [interaction.guildId, interaction.options.getString("group",true)]);
    if (!c || !g) return interaction.reply({content:"Group or child not found.",ephemeral:true});
    db.run("INSERT OR IGNORE INTO group_members(group_id,child_id) VALUES(?,?)", [g.id,c.id]);
    return interaction.reply(`➕ Added **${c.name}** to the group.`);
  }
}
