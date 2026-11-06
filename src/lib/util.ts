import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function select(options: string[]): Promise<number> {
  const rl = readline.createInterface({ input, output });
  let selection: number | null = null;

  while (selection === null) {
    options.forEach((o, i) => {
      console.log(`[${i + 1}] ${o}`);
    })

    const answer = await rl.question(`Choose ${1}-${options.length}: `);
    const s = parseInt(answer, 10);
    if (!isNaN(s) && s >= 1 && s <= options.length) {
      selection = s - 1;
      break;
    }
  }

  rl.close();

  return selection;
}

export async function getFilename(): Promise<string> {
  const rl = readline.createInterface({ input, output });

  const fn = await rl.question("Filename: ");

  rl.close();

  return fn;
}

export function getDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatTime(d: Date): string {
  return d.toISOString().slice(11, 19);
}

export function toDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s);
  const valid = !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  return valid ? d : null;
}

export function formatDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
}
