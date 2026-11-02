/*
  * https://engineering.toggl.com/docs/track/api/me/#get-projects
  * https://engineering.toggl.com/docs/track/api/time_entries/
*/

import { Buffer } from 'node:buffer';
import { Project, TimeEntry } from './model.js';
import * as z from 'zod';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export class Toggl {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  async fetchProjects(): Promise<Project[]> {
    let data = await this.fetch("me/projects");

    return z.array(Project).parse(data);
  }

  async fetchTimeEntries(): Promise<TimeEntry[]> {
    let data = await this.fetch("me/time_entries", {
      "since": `${Date.now() - WEEK}`
    });

    return z.array(TimeEntry).parse(data);
  }

  async fetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const qs = new URLSearchParams(params);
    const url = `https://api.track.toggl.com/api/v9/${endpoint}${qs ? `?${qs}` : ""}`;
    const auth = Buffer.from(this.token + ":api_token").toString('base64');
    let res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
    });

    if (!res.ok) {
      throw new Error(`Toggl API returned ${res.status}: ${await res.text()}`);
    }

    return res.json();
  }
}
