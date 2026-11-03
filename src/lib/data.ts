import { DatabaseSync } from 'node:sqlite';
import { Project, TimeEntry } from './model.js';
import { Toggl } from './toggl.js';

export class Data {
  database: DatabaseSync;

  constructor(d: DatabaseSync) {
    this.database = d;
  }

  async updateDb(token: string) {
    const api = new Toggl(token);

    const projects = await api.fetchProjects();
    const timeEntries = await api.fetchTimeEntries();

    this.insertProjects(projects);
    this.insertTimeEntries(timeEntries);
  }

  insertProjects(projects: Project[]): boolean {
    const stmt = this.database.prepare(
      `INSERT INTO project(id, name)
       VALUES (?, ?)`
    );

    try {
      this.database.exec('BEGIN');
      for (const p of projects) {
        stmt.all(p.id, p.name);
      }
      this.database.exec('END');
      return true;
    } catch {
      this.database.exec("ROLLBACK");
      return false;
    }
  }

  insertTimeEntries(timeEntries: TimeEntry[]): boolean {
    const stmt = this.database.prepare(
      `INSERT INTO time_entry(id, project_id, start, stop, description)
       VALUES (?, ?, datetime(?), datetime(?), ?)`
    );

    try {
      this.database.exec('BEGIN');
      for (const t of timeEntries) {
        stmt.all(
          t.id,
          t.project_id,
          t.start.toISOString(),
          t.stop?.toISOString() ?? null,
          t.description
        );
      }
      this.database.exec('END');
      return true;
    } catch {
      this.database.exec("ROLLBACK");
      return false;
    }
  }

  getProjects(): Project[] {
    return this.database.prepare(
      `SELECT * FROM project;`
    ).all() as Project[];
  }

  getTimeEntries(): TimeEntry[] {
    const l = this.database.prepare(
      `SELECT * FROM time_entry;`
    ).all();

    return l.map(t => {
      return {
        id: t.id,
        project_id: t.project_id,
        start: new Date(t.start as string),
        stop: new Date(t.stop as string),
        description: t.description
      } as TimeEntry;
    })
  }
}
