import { EmbedBuilder } from "discord.js";
import { BRAND } from "./constants.js";
import { ageLabel } from "./utils.js";

export function behaviorEmbed(result) {
  const e = new EmbedBuilder().setColor(BRAND).setTitle(result.title || "KIDDO").setDescription(result.narrative || "");
  if (result.overall) e.addFields({ name: "Overall", value: String(result.overall), inline: true });
  if (result.pickup_state) e.addFields({ name: "Return/Pickup", value: String(result.pickup_state), inline: true });
  if (result.notable?.length) e.addFields({ name: "Notable", value: result.notable.slice(0, 3).map(x => `• ${x}`).join("\n") });
  return e.setFooter({ text: "KIDDO • Generated behavior is not permanent canon unless you confirm it." });
}

export function profileEmbed(child, avatarUrl = null) {
  const temps = child.primary_temperament + (child.secondary_temperament ? ` + ${child.secondary_temperament}` : "");
  const e = new EmbedBuilder().setColor(BRAND).setTitle(`🧸 ${child.name}`).setDescription(child.notes || "No custom behavior notes yet.")
    .addFields(
      { name: "Age", value: `${ageLabel(child.age_months)} • ${child.stage}`, inline: true },
      { name: "Temperament", value: temps, inline: true },
      { name: "Mood", value: child.current_mood || "Normal", inline: true },
      { name: "Traits", value: child.traits?.join(", ") || "None set" }
    );
  if (avatarUrl || child.avatar_url) e.setThumbnail(avatarUrl || child.avatar_url);
  if (child.school) e.addFields({ name: "School", value: `${child.school.school_name} • ${child.school.classroom_name || child.school.grade || ""}` });
  return e;
}
