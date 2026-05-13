import { type PeriodDef } from "@/lib/api";

// ── Day constants ──────────────────────────────────────────────────────────

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const CLASSES = ["Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"];

// ── Default period definitions ─────────────────────────────────────────────

export const DEFAULT_PERIOD_DEFS: PeriodDef[] = [
  { id: "P1",   label: "Period 1", time_start: "08:00", time_end: "08:45", is_break: false, sort_order: 0 },
  { id: "P2",   label: "Period 2", time_start: "08:45", time_end: "09:30", is_break: false, sort_order: 1 },
  { id: "BRK1", label: "Break",    time_start: "09:30", time_end: "09:45", is_break: true,  sort_order: 2 },
  { id: "P3",   label: "Period 3", time_start: "09:45", time_end: "10:30", is_break: false, sort_order: 3 },
  { id: "P4",   label: "Period 4", time_start: "10:30", time_end: "11:15", is_break: false, sort_order: 4 },
  { id: "LCH",  label: "Lunch",    time_start: "11:15", time_end: "12:00", is_break: true,  sort_order: 5 },
  { id: "P5",   label: "Period 5", time_start: "12:00", time_end: "12:45", is_break: false, sort_order: 6 },
  { id: "P6",   label: "Period 6", time_start: "12:45", time_end: "13:30", is_break: false, sort_order: 7 },
];

export const DEFAULT_NURSERY_DEFS: PeriodDef[] = [
  { id: "P1",   label: "Period 1", time_start: "08:00", time_end: "08:45", is_break: false, sort_order: 0 },
  { id: "P2",   label: "Period 2", time_start: "08:45", time_end: "09:30", is_break: false, sort_order: 1 },
  { id: "BRK1", label: "Break",    time_start: "09:30", time_end: "09:45", is_break: true,  sort_order: 2 },
  { id: "P3",   label: "Period 3", time_start: "09:45", time_end: "10:30", is_break: false, sort_order: 3 },
  { id: "P4",   label: "Period 4", time_start: "10:30", time_end: "11:15", is_break: false, sort_order: 4 },
];

export function defaultDefsForClass(cls: string): PeriodDef[] {
  return cls.toLowerCase() === "nursery" ? DEFAULT_NURSERY_DEFS : DEFAULT_PERIOD_DEFS;
}

// ── Subject styles ─────────────────────────────────────────────────────────

export const SUBJECT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Mathematics:      { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    dot: "bg-blue-400"    },
  Science:          { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  English:          { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-800",  dot: "bg-violet-400"  },
  "Social Studies": { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400"   },
  Hindi:            { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-800",    dot: "bg-rose-400"    },
  "Computer Sc.":   { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-800",    dot: "bg-cyan-400"    },
  "Phys. Ed.":      { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400"  },
  Art:              { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-800",    dot: "bg-pink-400"    },
};

/** Returns the style object for a subject key, falling back to Mathematics. */
export function subjectStyle(key: string) {
  return SUBJECT_STYLES[key] ?? SUBJECT_STYLES["Mathematics"];
}
