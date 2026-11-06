import { DatabaseSync } from 'node:sqlite';
import { Project, TimeEntry } from './model.js';
import { Toggl } from './toggl.js';
import { getDate, formatDuration, formatTime } from './date.js';

export interface TimeEntryView {
  projectName: string,
  start: string,
  stop: string,
  duration: string,
  description: string
}

export interface TimeEntryExt extends TimeEntry {
  projectName: string,
  duration: number | null
}

export function toView(t: TimeEntryExt): TimeEntryView {
  return {
    projectName: t.projectName ?? "NaN",
    start: formatTime(t.start),
    stop: t.stop ? formatTime(t.stop) : "Nan",
    duration: t.duration ? formatDuration(t.duration) : "NaN",
    description: t.description ?? ""
  };
}

export function groupTimeEntries(
  items: TimeEntryExt[]
): { date: string, total: string, items: TimeEntryExt[] }[] {
  const groups = new Map<string, TimeEntryExt[]>();
  for (const item of items) {
    const key = getDate(item.start);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, bucket]) => ({
      date,
      total: formatDuration(bucket.reduce((p, c) => {
        return p + (c.duration ?? 0)
      }, 0)),
      items: bucket
    }));
}

export class Data {
  database: DatabaseSync;

  constructor(d: DatabaseSync) {
    this.database = d;
  }

  async update(token: string) {
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

  getTimeEntries(range?: { from: Date, to: Date }): TimeEntryExt[] {
    const l = range === undefined ?
      this.database.prepare(
        `SELECT * FROM time_entry
         LEFT JOIN project ON project_id=project.id`
      ).all() :
      this.database.prepare(
        `SELECT * FROM time_entry
         LEFT JOIN project ON project_id=project.id
           WHERE date(start) >= ?
                 AND date(start) <= ?`
      ).all(getDate(range.from), getDate(range.to));

    return l.map(t => {
      const startDate = new Date(t.start as string);
      const stopDate = t.stop
        ? new Date(t.stop as string)
        : null;
      const duration = stopDate
        ? stopDate.getTime() - startDate.getTime()
        : null;
      return {
        id: t.id as number,
        project_id: t.project_id as number | null,
        projectName: t.name as string,
        start: startDate,
        stop: stopDate,
        duration: duration,
        description: t.description as string | null
      };
    })
  }
}
