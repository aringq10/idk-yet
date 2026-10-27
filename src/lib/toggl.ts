import { Buffer } from 'node:buffer';
import * as z from 'zod';

const IsoDate = z.iso
  .datetime({ offset: true })
  .transform((s) => new Date(s))
  .refine((d) => !isNaN(d.getTime()), "Invalid date");

const Project = z.object({
  id: z.number(),
  name: z.string()
});

const TimeEntry = z.object({
  id: z.number(),
  description: z.string().nullable(),
  project_id: z.number().nullable(),
  start: IsoDate,
  stop: IsoDate.nullable()
});

export type Project = z.infer<typeof Project>;
export type TimeEntry = z.infer<typeof TimeEntry>;

class ApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
  }

  static from(e: unknown): ApiError {
    if (e instanceof ApiError) return e;
    if (e instanceof Error) return new ApiError(e.message, { cause: e });
    return new ApiError(String(e), { cause: e });
  }
}

interface Credentials {
  api_token: string;
}

export default class Api {
  credentials: Credentials;

  constructor(c: Credentials) {
    this.credentials = c;
  }

  async fetchProjects(): Promise<Project[]> {
    try {
      let data = await this.fetch("me/projects");

      return z.array(Project).parse(data);
    } catch(e) {
      throw ApiError.from(e);
    }
  }

  async fetchTimeEntries(): Promise<TimeEntry[]> {
    try {
      let data = await this.fetch("me/time_entries", {
        "before": new Date().toISOString()
      });

      return z.array(TimeEntry).parse(data);
    } catch(e) {
      throw ApiError.from(e);
    }
  }

  async fetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    try {
      const qs = new URLSearchParams(params);
      const url = `https://api.track.toggl.com/api/v9/${endpoint}${qs ? `?${qs}` : ""}`;
      const auth = Buffer.from(this.credentials.api_token + ":api_token").toString('base64');
      let res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
      });

      if (!res.ok) {
        throw new ApiError(`${res.status}: ${await res.text()}`);
      }

      return res.json();
    } catch(e) {
      throw ApiError.from(e);
    }
  }
}
