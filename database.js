import fs from "node:fs";
import path from "node:path";
import DatabaseLib from "better-sqlite3";

export class KiddoDatabase {
  constructor(dbPath = "./kiddo.sqlite") {
    const resolved = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    this.db = new DatabaseLib(resolved);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
    this.db.exec(schema);
  }

  run(sql, params = []) { return this.db.prepare(sql).run(...params); }
  get(sql, params = []) { return this.db.prepare(sql).get(...params); }
  all(sql, params = []) { return this.db.prepare(sql).all(...params); }

  addChild(data) {
    const tx = this.db.transaction(() => {
      const info = this.run(`INSERT INTO children(guild_id,created_by,name,nickname,pronouns,birthday,age_months,stage,primary_temperament,secondary_temperament,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`, [data.guildId, data.createdBy, data.name, data.nickname ?? null, data.pronouns ?? null, data.birthday ?? null, data.ageMonths, data.stage, data.primaryTemperament, data.secondaryTemperament ?? null, data.notes ?? null]);
      const id = Number(info.lastInsertRowid);
      this.run("INSERT INTO behavior_stats(child_id) VALUES(?)", [id]);
      for (const trait of data.traits) this.run("INSERT INTO child_traits(child_id,trait) VALUES(?,?)", [id, trait]);
      return id;
    });
    return tx();
  }

  getChild(guildId, name) {
    const child = this.get("SELECT * FROM children WHERE guild_id=? AND lower(name)=lower(?)", [guildId, name]);
    if (!child) return null;
    const id = child.id;
    child.traits = this.all("SELECT trait FROM child_traits WHERE child_id=? ORDER BY trait", [id]).map(r => r.trait);
    child.stats = this.get("SELECT * FROM behavior_stats WHERE child_id=?", [id]) ?? {};
    child.relationships = this.all("SELECT * FROM relationships WHERE child_id=?", [id]);
    child.preferences = this.all("SELECT * FROM preferences WHERE child_id=? AND (confirmed=1 OR confidence>=50)", [id]);
    child.history = this.all("SELECT * FROM history WHERE child_id=? ORDER BY happened_at DESC LIMIT 12", [id]);
    child.effects = this.all("SELECT * FROM temporary_effects WHERE child_id=? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)", [id]);
    child.schedule = this.all("SELECT * FROM schedules WHERE child_id=? ORDER BY weekday,start_time", [id]);
    child.school = this.get(`SELECT s.name school_name,s.type school_type,c.name classroom_name,c.grade,c.teacher_name,c.teacher_style,c.notes classroom_notes
      FROM enrollments e JOIN classrooms c ON c.id=e.classroom_id JOIN schools s ON s.id=c.school_id WHERE e.child_id=?`, [id]) ?? null;
    child.peer_relationships = this.all(`SELECT cr.*, CASE WHEN cr.child_a=? THEN b.name ELSE a.name END peer_name
      FROM child_relationships cr JOIN children a ON a.id=cr.child_a JOIN children b ON b.id=cr.child_b
      WHERE cr.child_a=? OR cr.child_b=?`, [id, id, id]);
    child.groups = this.all(`SELECT g.name,g.type,g.notes FROM group_members gm JOIN groups_tbl g ON g.id=gm.group_id WHERE gm.child_id=?`, [id]);
    return child;
  }

  childNames(guildId, query = "") {
    return this.all("SELECT name FROM children WHERE guild_id=? AND lower(name) LIKE lower(?) ORDER BY name LIMIT 25", [guildId, `%${query}%`]).map(r => r.name);
  }

  logObservations(childId, source, observations = []) {
    for (const o of observations.slice(0, 3)) {
      this.run("INSERT INTO observations(child_id,source,category,observation,confidence) VALUES(?,?,?,?,?)", [childId, source, String(o.category ?? "behavior"), String(o.text ?? ""), Math.max(0, Math.min(100, Number(o.confidence ?? 20)))]);
    }
  }
}
