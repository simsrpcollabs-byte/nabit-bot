from __future__ import annotations
import json
from pathlib import Path
import aiosqlite

class Database:
    def __init__(self, path: str):
        self.path = path

    async def init(self):
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
        async with aiosqlite.connect(self.path) as db:
            await db.executescript(schema)
            await db.commit()

    async def execute(self, sql: str, params=()):
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(sql, params)
            await db.commit()
            return cur.lastrowid

    async def fetchone(self, sql: str, params=()):
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(sql, params)
            row = await cur.fetchone()
            return dict(row) if row else None

    async def fetchall(self, sql: str, params=()):
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(sql, params)
            return [dict(r) for r in await cur.fetchall()]

    async def add_child(self, *, guild_id: int, created_by: int, name: str, age_months: int, stage: str,
                        primary_temperament: str, secondary_temperament: str | None, pronouns: str | None,
                        birthday: str | None, nickname: str | None, notes: str | None, traits: list[str]):
        async with aiosqlite.connect(self.path) as db:
            cur = await db.execute(
                """INSERT INTO children(guild_id,created_by,name,nickname,pronouns,birthday,age_months,stage,primary_temperament,secondary_temperament,notes)
                VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (guild_id, created_by, name, nickname, pronouns, birthday, age_months, stage, primary_temperament, secondary_temperament, notes),
            )
            child_id = cur.lastrowid
            await db.execute("INSERT INTO behavior_stats(child_id) VALUES(?)", (child_id,))
            await db.executemany("INSERT INTO child_traits(child_id,trait) VALUES(?,?)", [(child_id, t) for t in traits])
            await db.commit()
            return child_id

    async def get_child(self, guild_id: int, name: str):
        child = await self.fetchone("SELECT * FROM children WHERE guild_id=? AND lower(name)=lower(?)", (guild_id, name))
        if not child:
            return None
        child_id = child["id"]
        child["traits"] = [r["trait"] for r in await self.fetchall("SELECT trait FROM child_traits WHERE child_id=?", (child_id,))]
        child["stats"] = await self.fetchone("SELECT * FROM behavior_stats WHERE child_id=?", (child_id,)) or {}
        child["relationships"] = await self.fetchall("SELECT * FROM relationships WHERE child_id=?", (child_id,))
        child["preferences"] = await self.fetchall("SELECT * FROM preferences WHERE child_id=? AND (confirmed=1 OR confidence>=50)", (child_id,))
        child["history"] = await self.fetchall("SELECT * FROM history WHERE child_id=? ORDER BY happened_at DESC LIMIT 12", (child_id,))
        child["effects"] = await self.fetchall("SELECT * FROM temporary_effects WHERE child_id=? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)", (child_id,))
        child["schedule"] = await self.fetchall("SELECT * FROM schedules WHERE child_id=? ORDER BY weekday,start_time", (child_id,))
        enrollment = await self.fetchone("""SELECT s.name school_name,s.type school_type,c.name classroom_name,c.grade,c.teacher_name,c.teacher_style,c.notes classroom_notes
            FROM enrollments e JOIN classrooms c ON c.id=e.classroom_id JOIN schools s ON s.id=c.school_id WHERE e.child_id=?""", (child_id,))
        child["school"] = enrollment
        peers = await self.fetchall("""SELECT cr.*, CASE WHEN cr.child_a=? THEN b.name ELSE a.name END peer_name
            FROM child_relationships cr JOIN children a ON a.id=cr.child_a JOIN children b ON b.id=cr.child_b
            WHERE cr.child_a=? OR cr.child_b=?""", (child_id, child_id, child_id))
        child["peer_relationships"] = peers
        return child

    async def log_observation(self, child_id: int, source: str, category: str, observation: str, confidence: int = 20):
        return await self.execute("INSERT INTO observations(child_id,source,category,observation,confidence) VALUES(?,?,?,?,?)", (child_id, source, category, observation, confidence))
