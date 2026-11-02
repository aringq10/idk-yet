import { readFileSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { exit } from 'node:process';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Data } from './lib/data.js';
import { Toggl } from './lib/toggl.js';
import { select, getFilename } from './lib/util.js';
import { Project, TimeEntry } from './lib/model.js';
import * as z from 'zod';

const token = process.env.API_TOKEN;
if (!token) throw new Error("API_TOKEN is not set");

const database = new DatabaseSync("main.db");
database.exec(readFileSync("sql/schema.sql").toString());

const data = new Data(database);
const api = new Toggl(token);

const actions: [string, () => void | Promise<void>][]= [
  ["Insert projects from json", async () => {
    const fn = await getFilename();
    const fh = await open(fn, 'r');
    const json = await fh.readFile('utf8');
    const projects = z.array(Project).parse(JSON.parse(json));
    data.insertProjects(projects);
  }],
  ["Insert time entries from json", async () => {
    const fn = await getFilename();
    const fh = await open(fn, 'r');
    const json = await fh.readFile('utf8');
    const timeEntries = z.array(TimeEntry).parse(JSON.parse(json));
    data.insertTimeEntries(timeEntries);
  }],
  ["List projects", () => {
    console.table(data.getProjects());
  }],
  ["List time entries", () => {
    console.table(data.getTimeEntries());
  }],
  ["Fetch projects to json", async () => {
    const fn = await getFilename();
    const fh = await open(fn, 'w');
    await fh.writeFile(JSON.stringify(await api.fetchProjects()), 'utf8');
    console.log(`Wrote to ${resolve(fn)}`)
  }],
  ["Fetch time entries to json", async () => {
    const fn = await getFilename();
    const fh = await open(fn, 'w');
    await fh.writeFile(JSON.stringify(await api.fetchTimeEntries()), 'utf8');
    console.log(`Wrote to ${resolve(fn)}`)
  }],
  ["Run updateDb", () => {
    data.updateDb(token);
  }],
  ["Quit", () => exit() ]
];

while (true) {
  try {
    const a = await select(actions.map(v => v[0]));

    await actions[a]![1]();
  } catch (e) {
    if (e instanceof Error) console.error(`Error: ${e.message}`);
    else console.error("Error: unknown");
  }
}
