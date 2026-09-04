export function stageForMonths(ageMonths) {
  if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 215) throw new Error("KIDDO supports ages birth through 17.");
  if (ageMonths <= 11) return "Infant";
  if (ageMonths <= 23) return "Young Toddler";
  if (ageMonths <= 47) return "Toddler";
  if (ageMonths <= 71) return "Preschool";
  if (ageMonths <= 107) return "Early Childhood";
  if (ageMonths <= 143) return "Middle Childhood";
  if (ageMonths <= 179) return "Early Adolescence";
  return "Older Teen";
}

export function ageLabel(ageMonths) {
  if (ageMonths < 24) return `${ageMonths} month${ageMonths === 1 ? "" : "s"}`;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months ? `${years}y ${months}m` : `${years} years`;
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function safeJson(text, fallback = null) {
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return fallback;
}

export function ageMonthsFromSelection(stage, ageValue) {
  const value = String(ageValue || "").trim().toLowerCase();
  const monthMatch = value.match(/^(\d{1,2})\s+months?$/);
  const yearMatch = value.match(/^(\d{1,2})\s+years?$/);
  let months;
  if (monthMatch) months = Number(monthMatch[1]);
  else if (yearMatch) months = Number(yearMatch[1]) * 12;
  else throw new Error("Choose an age from the KIDDO age list.");
  if (stageForMonths(months) !== stage) throw new Error(`That age does not belong to the ${stage} age group.`);
  return months;
}
