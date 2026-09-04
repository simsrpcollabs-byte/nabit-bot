import OpenAI from "openai";
import { safeJson } from "./utils.js";

const SYSTEM_PROMPT = `You are KIDDO, a roleplay child-behavior simulator for fictional characters ages birth through 17.
Generate believable behavior for THIS specific child, not a generic age stereotype.

Rules:
- Developmental ability is a hard constraint. Never give a child skills, language, independence, school demands, or emotional insight far beyond the profile/age unless explicitly established.
- Canon data supplied by the user outranks everything. Do not contradict it.
- Temperament affects tendencies, not guaranteed outcomes.
- Temporary state and context can override usual behavior without changing personality.
- Do not manufacture constant drama. Ordinary, uneventful behavior is realistic.
- Preserve continuity with relationships, school peers, routines, preferences and history.
- For teens, write age-appropriate social/academic behavior, not daycare-style reports.
- Never diagnose a child or label normal behavior as a disorder.
- Never permanently alter canon. You may suggest observations only.
- Keep romantic content age-appropriate and nonsexual.

Return ONLY valid JSON with this shape:
{"title":"short title","narrative":"the RP-ready result","overall":"short overall mood/outcome","pickup_state":"optional or empty","notable":["0-3 moments"],"observations":[{"category":"preference|behavior|relationship|development","text":"possible pattern","confidence":20}]}`;

const PROXY_SYSTEM_PROMPT = `You are KIDDO's in-character proxy engine for fictional children and teens ages birth through 17.
Write ONLY what THIS child would do/say in the immediate roleplay moment.

Hard rules:
- Developmental ability is a hard constraint. Babies cannot speak beyond established ability; toddlers use plausible language; older kids/teens sound their age.
- Canon profile data outranks everything. Preserve temperament, quirks, mood, relationships and history.
- Do not make every scene dramatic. Small, ordinary reactions are often correct.
- Never diagnose or pathologize behavior.
- Keep all romantic content age-appropriate and nonsexual.
- Use *italics* for actions/nonverbal behavior/internal thoughts and **bold** for audible dialogue.
- Do not add a title, explanation, KIDDO commentary, labels, or quotation marks around the whole response.
- Do not narrate other characters' private thoughts or force other characters' actions.

Return ONLY valid JSON: {"content":"the in-character Discord RP message","observations":[{"category":"preference|behavior|relationship|development","text":"possible pattern","confidence":20}]}`;

function variation() {
  const r = Math.random();
  if (r < 0.65) return "EXPECTED: favor behavior strongly consistent with established tendencies.";
  if (r < 0.90) return "VARIATION: choose a believable but less typical reaction without changing personality.";
  return "OUTLIER: allow one surprising but developmentally realistic reaction; keep it an outlier.";
}

function profile(child) {
  return JSON.stringify({
    name: child.name,
    age_months: child.age_months,
    stage: child.stage,
    temperament: [child.primary_temperament, child.secondary_temperament].filter(Boolean),
    traits: child.traits,
    behavior_stats_0_to_100: child.stats,
    custom_notes: child.notes,
    current_mood: child.current_mood,
    relationships: child.relationships,
    peer_relationships: child.peer_relationships,
    preferences: child.preferences,
    recent_history: child.history,
    temporary_effects: child.effects,
    school: child.school,
    schedule: child.schedule,
    groups: child.groups
  });
}

export class BehaviorEngine {
  constructor(apiKey, model = "gpt-5.6-luna") {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = model;
  }

  async generate(child, task, context = "", detail = "Standard") {
    if (!this.client) return { title: `${child.name} — KIDDO`, narrative: "AI generation is not configured yet. Add OPENAI_API_KEY in Railway Variables.", overall: "Setup needed", pickup_state: "", notable: [], observations: [] };
    const prompt = `${variation()}\nDETAIL LEVEL: ${detail}\nTASK: ${task}\nCONTEXT: ${context || "No extra context supplied."}\nCHILD PROFILE JSON:\n${profile(child)}\n\nQuick: 60-120 words. Standard: 140-260. Detailed: 280-500.`;
    const response = await this.client.responses.create({ model: this.model, instructions: SYSTEM_PROMPT, input: prompt });
    const text = response.output_text?.trim() ?? "";
    return safeJson(text, { title: `${child.name} — KIDDO`, narrative: text, overall: "", pickup_state: "", notable: [], observations: [] });
  }

  async proxy(child, situation) {
    if (!this.client) return { content: "*KIDDO's AI generation is not configured yet.*", observations: [] };
    const prompt = `${variation()}\nSITUATION / RP CONTEXT: ${situation}\nCHILD PROFILE JSON:\n${profile(child)}\n\nKeep the proxy response concise enough to feel like a natural RP turn.`;
    const response = await this.client.responses.create({ model: this.model, instructions: PROXY_SYSTEM_PROMPT, input: prompt });
    const text = response.output_text?.trim() ?? "";
    return safeJson(text, { content: text, observations: [] });
  }
}
