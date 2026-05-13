import { type PeriodDef } from "@/lib/api";
import { type Period, type Timetable } from "./types";
import { DAYS } from "./constants";

// ── Parsing / formatting ───────────────────────────────────────────────────

export function parseTimeToAbsMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function absMinsToTimeStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatTimeDisplay(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")}`;
}

export function minsToLabel(absMin: number): string {
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Period builders ────────────────────────────────────────────────────────

export function buildPeriodsFromDefs(defs: PeriodDef[], schoolStart: number): Period[] {
  return [...defs]
    .sort((a, b) => parseTimeToAbsMins(a.time_start) - parseTimeToAbsMins(b.time_start))
    .map(def => ({
      id: def.id,
      label: def.label,
      time: `${formatTimeDisplay(def.time_start)} – ${formatTimeDisplay(def.time_end)}`,
      startMin: parseTimeToAbsMins(def.time_start) - schoolStart,
      durationMin: parseTimeToAbsMins(def.time_end) - parseTimeToAbsMins(def.time_start),
      isBreak: def.is_break,
    }));
}

export function schoolStartFromDefs(defs: PeriodDef[]): number {
  if (!defs.length) return 8 * 60;
  return Math.min(...defs.map(d => parseTimeToAbsMins(d.time_start)));
}

export function schoolEndFromDefs(defs: PeriodDef[]): number {
  if (!defs.length) return 13 * 60 + 30;
  return Math.max(...defs.map(d => parseTimeToAbsMins(d.time_end)));
}

export function emptyTimetableFromDefs(defs: PeriodDef[]): Timetable {
  const tt: Timetable = {};
  for (const day of DAYS) {
    tt[day] = {};
    for (const p of defs.filter(d => !d.is_break)) tt[day][p.id] = null;
  }
  return tt;
}

export function nowToMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function entryKey(day: string, periodId: string): string {
  return `${day}::${periodId}`;
}
