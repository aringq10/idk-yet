import * as z from 'zod';

const IsoDate = z.iso
  .datetime({ offset: true })
  .transform((s) => new Date(s))
  .refine((d) => !isNaN(d.getTime()), "Invalid date");

export const Project = z.object({
  id: z.number(),
  name: z.string()
});

export const TimeEntry = z.object({
  id: z.number(),
  project_id: z.number().nullable(),
  start: IsoDate,
  stop: IsoDate.nullable(),
  description: z.string().nullable()
});

export type Project = z.infer<typeof Project>;
export type TimeEntry = z.infer<typeof TimeEntry>;
