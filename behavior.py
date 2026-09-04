from __future__ import annotations
import json
import random
from openai import AsyncOpenAI

SYSTEM_PROMPT = """You are KIDDO, a roleplay child-behavior simulator for fictional characters ages birth through 17.
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
{
  "title": "short title",
  "narrative": "the RP-ready result",
  "overall": "short overall mood/outcome",
  "pickup_state": "optional return/pickup state or empty string",
  "notable": ["0-3 notable moments"],
  "observations": [{"category":"preference|behavior|relationship|development","text":"possible pattern","confidence":20}]
}
Observations are suggestions, not canon. Only include them when genuinely supported by the generated event.
"""

class BehaviorEngine:
    def __init__(self, api_key: str, model: str):
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None
        self.model = model

    def _variation(self) -> str:
        roll = random.random()
        if roll < .65:
            return "EXPECTED: favor behavior strongly consistent with established tendencies."
        if roll < .90:
            return "VARIATION: choose a believable but less typical reaction without changing personality."
        return "OUTLIER: allow one surprising but developmentally realistic reaction; explicitly keep it an outlier."

    def _profile(self, child: dict) -> str:
        stats = child.get("stats", {})
        return json.dumps({
            "name": child["name"], "age_months": child["age_months"], "stage": child["stage"],
            "temperament": [child["primary_temperament"], child.get("secondary_temperament")],
            "traits": child.get("traits", []), "behavior_stats_0_to_100": stats,
            "custom_notes": child.get("notes"), "current_mood": child.get("current_mood", "Normal"),
            "relationships": child.get("relationships", []), "peer_relationships": child.get("peer_relationships", []),
            "preferences": child.get("preferences", []), "recent_history": child.get("history", []),
            "temporary_effects": child.get("effects", []), "school": child.get("school"),
            "schedule": child.get("schedule", []),
        }, ensure_ascii=False, default=str)

    async def generate(self, child: dict, task: str, context: str = "", detail: str = "Standard") -> dict:
        if not self.client:
            return {
                "title": f"{child['name']} — KIDDO",
                "narrative": "AI generation is not configured yet. Add OPENAI_API_KEY to your .env file.",
                "overall": "Setup needed", "pickup_state": "", "notable": [], "observations": []
            }
        prompt = f"""{self._variation()}
DETAIL LEVEL: {detail}
TASK: {task}
CONTEXT: {context or 'No extra context supplied.'}
CHILD PROFILE JSON:
{self._profile(child)}

For Quick detail, keep narrative about 60-120 words. Standard: 140-260. Detailed: 280-500.
"""
        response = await self.client.responses.create(
            model=self.model,
            instructions=SYSTEM_PROMPT,
            input=prompt,
        )
        text = response.output_text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start, end = text.find("{"), text.rfind("}")
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end+1])
                except json.JSONDecodeError:
                    pass
            return {"title": f"{child['name']} — KIDDO", "narrative": text, "overall": "", "pickup_state": "", "notable": [], "observations": []}

PROXY_SYSTEM_PROMPT = """You are KIDDO's in-character proxy engine for fictional children and teens ages birth through 17.
Write ONLY what THIS child would do/say in the immediate roleplay moment.

Hard rules:
- Developmental ability is a hard constraint. Babies cannot speak beyond established ability; toddlers use plausible language; older kids/teens sound their age.
- Canon profile data outranks everything. Preserve temperament, quirks, mood, relationships and history.
- Do not make every scene dramatic. Small, ordinary reactions are often correct.
- Never diagnose or pathologize behavior.
- Keep all romantic content age-appropriate and nonsexual.
- This is a Discord RP proxy message. Use *italics* for actions/nonverbal behavior/internal thoughts and **bold** for audible dialogue.
- Do not add a title, explanation, KIDDO commentary, analysis, labels, or quotation marks around the whole response.
- Do not narrate other characters' private thoughts or force other characters' actions.

Return ONLY valid JSON:
{
  "content": "the in-character Discord RP message",
  "observations": [{"category":"preference|behavior|relationship|development","text":"possible pattern","confidence":20}]
}
"""

async def _generate_proxy(self, child: dict, situation: str, direction: str = "Respond naturally to the situation.") -> dict:
    if not self.client:
        return {"content": "*KIDDO's AI generation is not configured yet.*", "observations": []}
    prompt = f"""{self._variation()}
DIRECTION: {direction}
SITUATION / RP CONTEXT: {situation}
CHILD PROFILE JSON:
{self._profile(child)}

Keep the proxy message concise enough to feel like a natural RP turn. Let age and context determine whether the child talks, acts, fusses, stays quiet, texts, etc.
"""
    response = await self.client.responses.create(
        model=self.model,
        instructions=PROXY_SYSTEM_PROMPT,
        input=prompt,
    )
    text = response.output_text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                data = json.loads(text[start:end+1])
            except json.JSONDecodeError:
                data = {"content": text, "observations": []}
        else:
            data = {"content": text, "observations": []}
    if not isinstance(data, dict):
        data = {"content": text, "observations": []}
    data.setdefault("content", "")
    data.setdefault("observations", [])
    return data

BehaviorEngine.generate_proxy = _generate_proxy
