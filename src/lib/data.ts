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

  insertProjects(projects: Project[]) {
    const stmt = this.database.prepare(
      `INSERT OR ROLLBACK INTO project(id, name)
       VALUES (?, ?)`
    );

    this.database.exec('BEGIN');
    for (const p of projects) {
      stmt.all(p.id, p.name);
    }
    this.database.exec('END');
  }

  insertTimeEntries(timeEntries: TimeEntry[]) {
    const stmt = this.database.prepare(
      `INSERT OR ROLLBACK INTO time_entry(id, project_id, start, stop, description)
       VALUES (?, ?, datetime(?), datetime(?), ?)`
    );

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
