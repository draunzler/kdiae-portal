// ── Timetable domain types ─────────────────────────────────────────────────

export type Slot = { subject: string; teacher: string; colorKey: string } | null;
export type DaySchedule = Record<string, Slot>;
export type Timetable = Record<string, DaySchedule>;

export type Period = {
  id: string;
  label: string;
  time: string;
  startMin: number; // relative to schoolStart
  durationMin: number;
  isBreak?: boolean;
};

export interface DragState {
  periodId: string;
  day: string;
  slot: NonNullable<Slot>;
}
