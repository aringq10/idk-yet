export const WEEK = 7 * 24 * 60 * 60 * 1000;

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatTime(d: Date): string {
  return d.toISOString().slice(11, 19);
}

export function formatDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
}

export function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s);
  const valid = !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  return valid ? d : null;
}
