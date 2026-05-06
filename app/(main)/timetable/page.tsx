"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { timetableApi, scheduleApi, classesApi, type PeriodDef, type Class } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

type Slot = { subject: string; teacher: string; colorKey: string } | null;
type DaySchedule = Record<string, Slot>;
type Timetable = Record<string, DaySchedule>;

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const CLASSES = ["Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"];

const DEFAULT_PERIOD_DEFS: PeriodDef[] = [
  { id: "P1",   label: "Period 1", time_start: "08:00", time_end: "08:45", is_break: false, sort_order: 0 },
  { id: "P2",   label: "Period 2", time_start: "08:45", time_end: "09:30", is_break: false, sort_order: 1 },
  { id: "BRK1", label: "Break",    time_start: "09:30", time_end: "09:45", is_break: true,  sort_order: 2 },
  { id: "P3",   label: "Period 3", time_start: "09:45", time_end: "10:30", is_break: false, sort_order: 3 },
  { id: "P4",   label: "Period 4", time_start: "10:30", time_end: "11:15", is_break: false, sort_order: 4 },
  { id: "LCH",  label: "Lunch",    time_start: "11:15", time_end: "12:00", is_break: true,  sort_order: 5 },
  { id: "P5",   label: "Period 5", time_start: "12:00", time_end: "12:45", is_break: false, sort_order: 6 },
  { id: "P6",   label: "Period 6", time_start: "12:45", time_end: "13:30", is_break: false, sort_order: 7 },
];

const DEFAULT_NURSERY_DEFS: PeriodDef[] = [
  { id: "P1",   label: "Period 1", time_start: "08:00", time_end: "08:45", is_break: false, sort_order: 0 },
  { id: "P2",   label: "Period 2", time_start: "08:45", time_end: "09:30", is_break: false, sort_order: 1 },
  { id: "BRK1", label: "Break",    time_start: "09:30", time_end: "09:45", is_break: true,  sort_order: 2 },
  { id: "P3",   label: "Period 3", time_start: "09:45", time_end: "10:30", is_break: false, sort_order: 3 },
  { id: "P4",   label: "Period 4", time_start: "10:30", time_end: "11:15", is_break: false, sort_order: 4 },
];

function defaultDefsForClass(cls: string): PeriodDef[] {
  return cls.toLowerCase() === "nursery" ? DEFAULT_NURSERY_DEFS : DEFAULT_PERIOD_DEFS;
}

// ── Period type ──────────────────────────────────────────────────────────────────

type Period = {
  id: string;
  label: string;
  time: string;
  startMin: number; // relative to schoolStart
  durationMin: number;
  isBreak?: boolean;
};

// ── Period id ↔ label mapping ─────────────────────────────────────────────────
// Derived dynamically in the component. These empty objects satisfy static imports
// in the few places they were used before (now replaced).
const PERIOD_ID_TO_LABEL: Record<string, string> = {};
const PERIOD_LABEL_TO_ID: Record<string, string> = {};
void PERIOD_ID_TO_LABEL; void PERIOD_LABEL_TO_ID;

// ── Subject styles ─────────────────────────────────────────────────────────────

const SUBJECT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Mathematics:      { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    dot: "bg-blue-400"    },
  Science:          { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  English:          { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-800",  dot: "bg-violet-400"  },
  "Social Studies": { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400"   },
  Hindi:            { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-800",    dot: "bg-rose-400"    },
  "Computer Sc.":   { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-800",    dot: "bg-cyan-400"    },
  "Phys. Ed.":      { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400"  },
  Art:              { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-800",    dot: "bg-pink-400"    },
};

const C = (key: string) => SUBJECT_STYLES[key] ?? SUBJECT_STYLES["Mathematics"];

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTimeToAbsMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function absMinsToTimeStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatTimeDisplay(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")}`;
}

function minsToLabel(absMin: number): string {
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function buildPeriodsFromDefs(defs: PeriodDef[], schoolStart: number): Period[] {
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

function schoolStartFromDefs(defs: PeriodDef[]): number {
  if (!defs.length) return 8 * 60;
  return Math.min(...defs.map(d => parseTimeToAbsMins(d.time_start)));
}

function schoolEndFromDefs(defs: PeriodDef[]): number {
  if (!defs.length) return 13 * 60 + 30;
  return Math.max(...defs.map(d => parseTimeToAbsMins(d.time_end)));
}

function emptyTimetableFromDefs(defs: PeriodDef[]): Timetable {
  const tt: Timetable = {};
  for (const day of DAYS) {
    tt[day] = {};
    for (const p of defs.filter(d => !d.is_break)) tt[day][p.id] = null;
  }
  return tt;
}

function nowToMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes(); // absolute mins
}

interface DragState {
  periodId: string;
  day: string;
  slot: NonNullable<Slot>;
}

// ── Time Ruler ────────────────────────────────────────────────────────────────

function TimeRuler({
  simMins,
  periods,
  schoolStart,
  schoolEnd,
  totalMins,
}: {
  simMins: number;
  periods: Period[];
  schoolStart: number;
  schoolEnd: number;
  totalMins: number;
}) {
  const simRel = simMins - schoolStart;
  const pct = Math.max(0, Math.min(100, (simRel / totalMins) * 100));
  const inSchool = simMins >= schoolStart && simMins <= schoolEnd;
  const currentLabel = minsToLabel(Math.max(schoolStart, Math.min(schoolEnd, simMins)));

  const ticks = periods.map(p => ({
    id: p.id,
    pct: (p.startMin / totalMins) * 100,
    label: minsToLabel(schoolStart + p.startMin),
    isBreak: p.isBreak,

  }));

  return (
    <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white select-none">
      <div className="flex items-center gap-3">
        {/* Time pill */}
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums shadow-sm border transition-all ${
            inSchool
              ? "bg-[#007BFF] text-white border-[#0062cc]"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${inSchool ? "bg-white animate-pulse" : "bg-slate-300"}`} />
          {currentLabel}
        </div>

        {/* Ruler track */}
        <div className="relative flex-1 h-7 flex items-center">
          {/* Background track */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />

          {/* Filled track */}
          {inSchool && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#007BFF]/30 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          )}

          {/* Tick marks */}
          {ticks.map(t => (
            <div
              key={t.id}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${t.pct}%`, transform: "translateX(-50%)" }}
            >
              <div className={`w-px h-2 mt-1.5 ${t.isBreak ? "bg-slate-200" : "bg-slate-300"}`} />
              <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap mt-0.5">{t.label}</span>
            </div>
          ))}

          {/* End tick */}
          <div className="absolute top-0 right-0 flex flex-col items-center" style={{ transform: "translateX(50%)" }}>
            <div className="w-px h-2 mt-1.5 bg-slate-300" />
            <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap mt-0.5">{minsToLabel(schoolEnd)}</span>
          </div>

          {/* Now marker dot */}
          {inSchool && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#007BFF] rounded-full ring-2 ring-white shadow transition-all duration-1000 z-10"
              style={{ left: `${pct}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

// ── Entry ID map helpers ──────────────────────────────────────────────────────

function entryKey(day: string, periodId: string) { return `${day}::${periodId}`; }

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("Class 6");
  const [classesList, setClassesList]     = useState<Class[]>([]);
  const [classSubjects, setClassSubjects] = useState<string[]>(Object.keys(SUBJECT_STYLES));
  const subjectsAbortRef                  = useRef<AbortController | null>(null);
  const [periodDefs, setPeriodDefs] = useState<PeriodDef[]>(defaultDefsForClass("Class 6"));
  const [timetables, setTimetables] = useState<Record<string, Timetable>>(
    { "Class 6": emptyTimetableFromDefs(defaultDefsForClass("Class 6")) }
  );
  // "day::periodId" → backend entry id
  const [entryMap, setEntryMap] = useState<Record<string, string>>({});
  const [classLoading, setClassLoading] = useState(false);
  const [simMins, setSimMins] = useState<number>(nowToMinutes());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ periodId: string; day: string } | null>(null);
  const [activeDay, setActiveDay] = useState<string>("Monday");

  // ── Derived schedule values ────────────────────────────────────────────────
  const schoolStart = useMemo(() => schoolStartFromDefs(periodDefs), [periodDefs]);
  const schoolEnd   = useMemo(() => schoolEndFromDefs(periodDefs), [periodDefs]);
  const totalMins   = useMemo(() => schoolEnd - schoolStart, [schoolStart, schoolEnd]);
  const periods     = useMemo(() => buildPeriodsFromDefs(periodDefs, schoolStart), [periodDefs, schoolStart]);
  const periodIdToLabel = useMemo(
    () => Object.fromEntries(periodDefs.filter(d => !d.is_break).map(d => [d.id, d.label])),
    [periodDefs]
  );
  const periodLabelToId = useMemo(
    () => Object.fromEntries(Object.entries(periodIdToLabel).map(([id, lbl]) => [lbl, id])),
    [periodIdToLabel]
  );

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const data = timetables[selectedClass] ?? emptyTimetableFromDefs(periodDefs);

  // Load classes list on mount (for dropdown)
  useEffect(() => {
    classesApi.list().then(list => {
      setClassesList(list.filter(c => c.status === "active"));
      // Seed subjects for the initial selectedClass
      const match = list.find(c => c.name === "Class 6");
      if (match && match.subjects.length) setClassSubjects(match.subjects);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch subjects for the selected class via API; cancel previous in-flight request
  useEffect(() => {
    // Abort any previous fetch
    subjectsAbortRef.current?.abort();
    const controller = new AbortController();
    subjectsAbortRef.current = controller;

    classesApi.list(controller.signal)
      .then(list => {
        const match = list.find(c => c.name === selectedClass);
        setClassSubjects(match && match.subjects.length ? match.subjects : Object.keys(SUBJECT_STYLES));
      })
      .catch(err => {
        if (err.name !== "AbortError") setClassSubjects(Object.keys(SUBJECT_STYLES));
      });

    return () => controller.abort();
  }, [selectedClass]);

  useEffect(() => {
    const id = setInterval(() => setSimMins(nowToMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Load schedule on mount
  useEffect(() => {
    scheduleApi.get(selectedClass).then(s => { if (s.periods.length) setPeriodDefs(s.periods); }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load class timetable + schedule from API ────────────────────────────────

  const loadClass = useCallback(async (className: string) => {
    setClassLoading(true);
    try {
      // Load schedule and timetable in parallel
      const [schedResult, entries] = await Promise.all([
        scheduleApi.get(className).catch(() => ({ periods: defaultDefsForClass(className) })),
        timetableApi.listByClass(className).catch(() => []),
      ]);
      const defs = schedResult.periods.length ? schedResult.periods : defaultDefsForClass(className);
      setPeriodDefs(defs);
      const labelToId = Object.fromEntries(defs.filter(d => !d.is_break).map(d => [d.label, d.id]));
      const tt = emptyTimetableFromDefs(defs);
      const map: Record<string, string> = {};
      for (const e of entries) {
        const periodId = labelToId[e.period] ?? e.period;
        if (!DAYS.includes(e.day)) continue;
        if (!tt[e.day]) tt[e.day] = {};
        tt[e.day][periodId] = { subject: e.subject, teacher: e.teacher, colorKey: e.subject };
        map[entryKey(e.day, periodId)] = e.id;
      }
      setTimetables(prev => ({ ...prev, [className]: tt }));
      setEntryMap(map);
    } finally {
      setClassLoading(false);
    }
  }, []);

  useEffect(() => { loadClass(selectedClass); }, [selectedClass, loadClass]);

  // ── Period def mutations ────────────────────────────────────────────────────
  const handleUpdatePeriodDef = useCallback((id: string, patch: Partial<PeriodDef>) => {
    setPeriodDefs(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...patch } : d);
      const sorted = [...next].sort((a, b) => parseTimeToAbsMins(a.time_start) - parseTimeToAbsMins(b.time_start));
      scheduleApi.save(selectedClass, { periods: sorted }).catch(() => {});
      return sorted;
    });
  }, [selectedClass]);

  const handleDeletePeriodRow = useCallback((id: string) => {
    setPeriodDefs(prev => {
      const next = prev.filter(d => d.id !== id);
      scheduleApi.save(selectedClass, { periods: next }).catch(() => {});
      return next;
    });
  }, [selectedClass]);

  const handleAddPeriodRow = useCallback((isBreak: boolean) => {
    setPeriodDefs(prev => {
      const sorted = [...prev].sort((a, b) => parseTimeToAbsMins(a.time_end) - parseTimeToAbsMins(b.time_end));
      const lastEnd = sorted.length ? parseTimeToAbsMins(sorted[sorted.length - 1].time_end) : 8 * 60;
      const endMins = lastEnd + (isBreak ? 15 : 45);
      const periodCount = prev.filter(d => !d.is_break).length;
      const newDef: PeriodDef = {
        id: `${isBreak ? "brk" : "p"}_${Date.now()}`,
        label: isBreak ? "Break" : `Period ${periodCount + 1}`,
        time_start: absMinsToTimeStr(lastEnd),
        time_end: absMinsToTimeStr(endMins),
        is_break: isBreak,
        sort_order: prev.length,
      };
      const next = [...prev, newDef];
      scheduleApi.save(selectedClass, { periods: next }).catch(() => {});
      return next;
    });
  }, [selectedClass]);

  const handleReorderPeriod = useCallback((dragId: string, dropId: string) => {
    if (dragId === dropId) return;
    setPeriodDefs(prev => {
      const sorted = [...prev].sort((a, b) => parseTimeToAbsMins(a.time_start) - parseTimeToAbsMins(b.time_start));
      const dragIdx = sorted.findIndex(d => d.id === dragId);
      const dropIdx = sorted.findIndex(d => d.id === dropId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      const [item] = sorted.splice(dragIdx, 1);
      sorted.splice(dropIdx, 0, item);
      // Re-assign times: keep drag item's duration, cascade from drop position
      // Simple swap: just swap time_start/time_end between the two
      const a = sorted[dragIdx];
      const b = sorted[dropIdx];
      const tmpStart = a.time_start; const tmpEnd = a.time_end;
      sorted[dragIdx] = { ...a, time_start: b.time_start, time_end: b.time_end };
      sorted[dropIdx] = { ...b, time_start: tmpStart, time_end: tmpEnd };
      scheduleApi.save(selectedClass, { periods: sorted }).catch(() => {});
      return sorted;
    });
  }, [selectedClass]);

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((periodId: string, day: string, slot: NonNullable<Slot>) => {
    setDragState({ periodId, day, slot });
  }, []);

  const handleDrop = useCallback((targetPeriodId: string, targetDay: string) => {
    if (!dragState) return;
    const { periodId: srcPeriodId, day: srcDay } = dragState;
    if (srcPeriodId === targetPeriodId && srcDay === targetDay) {
      setDragState(null); setDropTarget(null); return;
    }

    // Capture current slots & ids before state update
    const srcSlot = data[srcDay]?.[srcPeriodId];
    const tgtSlot = data[targetDay]?.[targetPeriodId];
    const srcId  = entryMap[entryKey(srcDay, srcPeriodId)];
    const tgtId  = entryMap[entryKey(targetDay, targetPeriodId)];

    // Optimistic local swap
    setTimetables(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      next[selectedClass][srcDay][srcPeriodId]       = tgtSlot ?? null;
      next[selectedClass][targetDay][targetPeriodId] = srcSlot ?? null;
      return next;
    });
    setEntryMap(prev => {
      const next = { ...prev };
      if (srcId)  next[entryKey(targetDay, targetPeriodId)] = srcId;
      else        delete next[entryKey(targetDay, targetPeriodId)];
      if (tgtId)  next[entryKey(srcDay, srcPeriodId)] = tgtId;
      else        delete next[entryKey(srcDay, srcPeriodId)];
      return next;
    });
    setDragState(null); setDropTarget(null);

    // Sync to API: update each entry's position
    if (srcId) {
      timetableApi.update(srcId, {
        day: targetDay,
        period: periodIdToLabel[targetPeriodId] ?? targetPeriodId,
      }).catch(() => {});
    }
    if (tgtId) {
      timetableApi.update(tgtId, {
        day: srcDay,
        period: periodIdToLabel[srcPeriodId] ?? srcPeriodId,
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, selectedClass, data, entryMap]);

  // ── Delete slot ─────────────────────────────────────────────────────────────

  const handleDeleteSlot = useCallback((periodId: string, day: string) => {
    const id = entryMap[entryKey(day, periodId)];
    setTimetables(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      next[selectedClass][day][periodId] = null;
      return next;
    });
    if (id) {
      setEntryMap(prev => { const n = { ...prev }; delete n[entryKey(day, periodId)]; return n; });
      timetableApi.delete(id).catch(() => {});
    }
  }, [selectedClass, entryMap]);

  // ── Add slot ─────────────────────────────────────────────────────────────────

  const handleAddSlot = useCallback((periodId: string, day: string, subject: string, teacher: string) => {
    // Optimistic local update
    setTimetables(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      if (!next[selectedClass][day]) next[selectedClass][day] = {};
      next[selectedClass][day][periodId] = { subject, teacher, colorKey: subject };
      return next;
    });
    // Persist to API
    timetableApi.create({
      teacher_email: "",
      teacher,
      period: periodIdToLabel[periodId] ?? periodId,
      day,
      subject,
      class_name: selectedClass,
    }).then(entry => {
      setEntryMap(prev => ({ ...prev, [entryKey(day, periodId)]: entry.id }));
    }).catch(() => {});
  }, [selectedClass]);

  const sharedProps = {
    data, periods, periodDefs, simMins, schoolStart, totalMins, dragState, dropTarget,
    subjectList: classSubjects,
    onDragStart: handleDragStart, onDrop: handleDrop,
    onDragOver: setDropTarget,
    onDragEnd: () => { setDragState(null); setDropTarget(null); },
    onDelete: handleDeleteSlot,
    onAdd: handleAddSlot,
    onUpdatePeriodDef: handleUpdatePeriodDef,
    onDeletePeriodRow: handleDeletePeriodRow,
    onAddPeriodRow: handleAddPeriodRow,
    onReorderPeriod: handleReorderPeriod,
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <Tabs defaultValue="week" className="gap-0">
          {/* Controls row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList>
                <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
              </TabsList>
              {/* Day selector shown in day tab */}
              <TabsContent value="day" className="mt-0 flex-none">
                <Tabs value={activeDay} onValueChange={setActiveDay}>
                  <TabsList>
                    {DAYS.map((d, i) => {
                      const isToday = d === todayName;
                      const isActive = d === activeDay;
                      return (
                        <TabsTrigger
                          key={d}
                          value={d}
                          className={!isActive && isToday ? "text-[#007BFF] font-semibold text-xs" : "text-xs"}
                        >
                          <span className="flex items-center gap-1">
                            {DAY_SHORT[i]}
                            {isToday && !isActive && (
                              <span className="w-1 h-1 rounded-full bg-[#007BFF] inline-block" />
                            )}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </TabsContent>
            </div>
            <div className="flex items-center gap-2">
              {dragState && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-[12px] text-amber-700 font-medium animate-pulse">
                  <span>Dragging: {dragState.slot.subject}</span>
                  <span className="opacity-60">→ drop to swap</span>
                </div>
              )}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-36 bg-white border-slate-200 text-[13px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(classesList.length ? classesList.map(c => c.name) : CLASSES).map(c => (
                    <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Timetable card */}
          <Card className="shadow-none border-slate-200 overflow-hidden relative">
            {classLoading && (
              <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center rounded-inherit">
                <div className="flex items-center gap-2 text-[13px] text-slate-500">
                  <svg className="animate-spin w-4 h-4 text-[#007BFF]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Loading timetable…
                </div>
              </div>
            )}
            <TimeRuler simMins={simMins} periods={periods} schoolStart={schoolStart} schoolEnd={schoolEnd} totalMins={totalMins} />
            <TabsContent value="week" className="mt-0">
              <WeekView {...sharedProps} days={DAYS} todayName={todayName} />
            </TabsContent>
            <TabsContent value="day" className="mt-0">
              <DayView {...sharedProps} day={activeDay} isToday={activeDay === todayName} schoolEnd={schoolEnd} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  data, periods, periodDefs, days, simMins, schoolStart, totalMins, todayName,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd, onDelete, onAdd,
  onUpdatePeriodDef, onDeletePeriodRow, onAddPeriodRow, onReorderPeriod, subjectList,
}: {
  data: Timetable; periods: Period[]; periodDefs: PeriodDef[]; days: string[];
  simMins: number; schoolStart: number; totalMins: number; todayName: string;
  dragState: DragState | null; dropTarget: { periodId: string; day: string } | null;
  subjectList: string[];
  onDragStart: (p: string, d: string, s: NonNullable<Slot>) => void;
  onDrop: (p: string, d: string) => void;
  onDragOver: (t: { periodId: string; day: string } | null) => void;
  onDragEnd: () => void;
  onDelete: (periodId: string, day: string) => void;
  onAdd: (periodId: string, day: string, subject: string, teacher: string) => void;
  onUpdatePeriodDef: (id: string, patch: Partial<PeriodDef>) => void;
  onDeletePeriodRow: (id: string) => void;
  onAddPeriodRow: (isBreak: boolean) => void;
  onReorderPeriod: (dragId: string, dropId: string) => void;
}) {
  const inSchool = simMins >= schoolStart && simMins <= schoolStart + totalMins;
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [rowDragId, setRowDragId] = useState<string | null>(null);
  const [rowDropId, setRowDropId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="py-3 px-4 text-left w-36">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Time</span>
            </th>
            {days.map(d => (
              <th key={d} className={`py-3 px-2 text-center ${d === todayName ? "bg-blue-50/60" : ""}`}>
                <div className={`text-[12px] font-semibold ${d === todayName ? "text-[#007BFF]" : "text-slate-600"}`}>{d}</div>
                {d === todayName && <div className="text-[10px] text-[#007BFF]/70">Today</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(p => {
            const def = periodDefs.find(d => d.id === p.id);
            const relMins = simMins - schoolStart;
            const isCurrentPeriod = !p.isBreak && relMins >= p.startMin && relMins < p.startMin + p.durationMin;
            const showNowLine = inSchool && relMins >= p.startMin && relMins < p.startMin + p.durationMin;
            const nowLinePct = showNowLine ? ((relMins - p.startMin) / p.durationMin) * 100 : 0;
            const isRowDragOver = rowDropId === p.id && rowDragId !== p.id;

            return (
              <tr
                key={p.id}
                className={`border-b border-slate-100 transition-colors ${
                  isRowDragOver ? "bg-blue-50/50 outline outline-1 outline-[#007BFF]/30 outline-offset-[-1px]"
                  : isCurrentPeriod ? "bg-blue-50/40"
                  : p.isBreak ? "bg-slate-50/80"
                  : "hover:bg-slate-50/50"
                }`}
                onDragOver={e => { if (rowDragId) { e.preventDefault(); setRowDropId(p.id); } }}
                onDrop={e => {
                  if (rowDragId && rowDragId !== p.id) {
                    e.preventDefault();
                    onReorderPeriod(rowDragId, p.id);
                  }
                  setRowDragId(null); setRowDropId(null);
                }}
              >
                {/* Period label cell */}
                <td className="py-2 px-4 relative group/row">
                  {showNowLine && (
                    <div
                      className="absolute left-17 right-0 flex items-center gap-1 z-20 pointer-events-none"
                      style={{ top: `${nowLinePct}%`, transform: "translateY(-50%)" }}
                    >
                      <span className="bg-[#007BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums shadow-sm whitespace-nowrap">
                        {minsToLabel(simMins)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {/* Row drag handle */}
                    <div
                      draggable
                      onDragStart={e => { e.stopPropagation(); setRowDragId(p.id); }}
                      onDragEnd={() => { setRowDragId(null); setRowDropId(null); }}
                      className="shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-40 hover:!opacity-70 transition-opacity px-0.5 py-1 -ml-1 rounded"
                      title="Drag to reorder"
                    >
                      {[0,1,2].map(i => (
                        <div key={i} className="flex gap-[3px]">
                          <div className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                          <div className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                        </div>
                      ))}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isCurrentPeriod && <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-pulse shrink-0" />}
                        <p className={`text-[12px] font-semibold leading-tight ${isCurrentPeriod ? "text-[#007BFF]" : "text-slate-700"}`}>
                          {p.label}
                        </p>
                      </div>

                      {/* Inline time editor */}
                      {editingTimeId === p.id && def ? (
                        <div
                          className="flex items-center gap-1 mt-0.5"
                          onBlur={e => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setEditingTimeId(null);
                            }
                          }}
                        >
                          <input
                            type="time"
                            autoFocus
                            defaultValue={def.time_start}
                            className="text-[10px] font-mono text-slate-500 w-[4.2rem] bg-slate-100 rounded px-1 py-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-[#007BFF]/40"
                            onBlur={e => onUpdatePeriodDef(p.id, { time_start: e.target.value })}
                          />
                          <span className="text-[9px] text-slate-300">–</span>
                          <input
                            type="time"
                            defaultValue={def.time_end}
                            className="text-[10px] font-mono text-slate-500 w-[4.2rem] bg-slate-100 rounded px-1 py-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-[#007BFF]/40"
                            onBlur={e => onUpdatePeriodDef(p.id, { time_end: e.target.value })}
                          />
                        </div>
                      ) : (
                        <p
                          className="text-[10px] text-slate-400 font-mono mt-0.5 cursor-text hover:text-[#007BFF] hover:underline decoration-dotted transition-colors leading-tight"
                          title="Click to edit time"
                          onClick={() => setEditingTimeId(p.id)}
                        >
                          {p.time}
                        </p>
                      )}
                    </div>

                    {/* Delete row button */}
                    <button
                      onClick={() => onDeletePeriodRow(p.id)}
                      className="shrink-0 text-slate-200 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100 ml-auto"
                      title="Remove row"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="2,3 10,3"/><path d="M4,3V2h4v1"/><path d="M3,3l.7,7.3a.7.7 0 0 0 .7.7h3.2a.7.7 0 0 0 .7-.7L9,3"/>
                      </svg>
                    </button>
                  </div>
                </td>

                {/* Slots */}
                {p.isBreak
                  ? days.map(d => (
                      <td key={d} className={`py-2 px-2 text-center relative ${d === todayName ? "bg-blue-50/30" : ""}`}>
                        {showNowLine && (
                          <div
                            className="absolute inset-x-0 h-0.5 bg-[#007BFF] z-10 pointer-events-none"
                            style={{ top: `${nowLinePct}%` }}
                          />
                        )}
                        <span className="text-[11px] text-slate-400 italic">{p.label}</span>
                      </td>
                    ))
                  : days.map(d => {
                      const slot = data[d]?.[p.id];
                      const isDragSource = dragState?.periodId === p.id && dragState?.day === d;
                      const isDropTarget = dropTarget?.periodId === p.id && dropTarget?.day === d;
                      return (
                        <td
                          key={d}
                          className={`py-1.5 px-2 relative ${d === todayName ? "bg-blue-50/20" : ""}`}
                          onDragOver={e => { e.preventDefault(); onDragOver({ periodId: p.id, day: d }); }}
                          onDrop={e => { e.preventDefault(); onDrop(p.id, d); }}
                        >
                          {showNowLine && (
                            <div
                              className="absolute inset-x-0 h-0.5 bg-[#007BFF] z-10 pointer-events-none"
                              style={{ top: `${nowLinePct}%` }}
                            />
                          )}
                          <SlotCard
                            slot={slot}
                            isDragSource={isDragSource}
                            isDropTarget={isDropTarget}
                            onDragStart={() => slot && onDragStart(p.id, d, slot)}
                            onDragEnd={onDragEnd}
                            subjectList={subjectList}
                            onDelete={() => onDelete(p.id, d)}
                            onAdd={(subject, teacher) => onAdd(p.id, d, subject, teacher)}
                          />
                        </td>
                      );
                    })
                }
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-dashed border-slate-200">
            <td colSpan={days.length + 1} className="py-2 px-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddPeriodRow(false)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#007BFF] transition-colors font-medium"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
                  Add period
                </button>
                <span className="text-slate-200">·</span>
                <button
                  onClick={() => onAddPeriodRow(true)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
                  Add break
                </button>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  data, periods, day, simMins, schoolStart, totalMins, schoolEnd, isToday,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd, onDelete, onAdd, subjectList,
}: {
  data: Timetable; periods: Period[]; day: string; simMins: number; schoolStart: number; totalMins: number; schoolEnd: number; isToday: boolean;
  dragState: DragState | null; dropTarget: { periodId: string; day: string } | null;
  subjectList: string[];
  onDragStart: (p: string, d: string, s: NonNullable<Slot>) => void;
  onDrop: (p: string, d: string) => void;
  onDragOver: (t: { periodId: string; day: string } | null) => void;
  onDragEnd: () => void;
  onDelete: (periodId: string, day: string) => void;
  onAdd: (periodId: string, day: string, subject: string, teacher: string) => void;
}) {
  // 2px per minute
  const PX_PER_MIN = 2;
  const totalH = totalMins * PX_PER_MIN;

  const hourTicks: { label: string; offsetMin: number }[] = [];
  for (let m = schoolStart; m <= schoolEnd; m += 60) {
    hourTicks.push({ label: minsToLabel(m), offsetMin: m - schoolStart });
  }
  if (hourTicks[hourTicks.length - 1].offsetMin < totalMins) {
    hourTicks.push({ label: minsToLabel(schoolEnd), offsetMin: totalMins });
  }

  const inSchool = simMins >= schoolStart && simMins <= schoolEnd;
  const nowTop = (simMins - schoolStart) * PX_PER_MIN;

  return (
    <div className="p-4">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800">{day}</h3>
        {isToday && <Badge className="bg-blue-50 text-[#007BFF] border-blue-200 text-[10px] font-semibold px-2 py-0.5">Today</Badge>}
      </div>

      {/* Timeline */}
      <div className="flex gap-0">
        {/* Left ruler */}
        <div className="relative shrink-0 w-16 mr-3" style={{ height: totalH }}>
          {hourTicks.map(tick => (
            <div
              key={tick.label}
              className="absolute right-0 flex items-center justify-end"
              style={{ top: tick.offsetMin * PX_PER_MIN }}
            >
              <span className="text-[10px] text-slate-400 font-mono tabular-nums leading-none -translate-y-1/2">
                {tick.label}
              </span>
            </div>
          ))}
          {/* Now pill on ruler */}
          {isToday && inSchool && (
            <div
              className="absolute -right-3 z-20"
              style={{ top: nowTop }}
            >
              <span className="flex items-center gap-1 bg-[#007BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums shadow-sm -translate-y-1/2 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
                {minsToLabel(simMins)}
              </span>
            </div>
          )}
        </div>

        {/* Grid + events */}
        <div
          className="relative flex-1 rounded-xl overflow-hidden"
          style={{ height: totalH }}
          onDragOver={e => e.preventDefault()}
        >
          {/* Hour gridlines */}
          {hourTicks.map(tick => (
            <div
              key={tick.label}
              className="absolute inset-x-0 h-px bg-slate-100"
              style={{ top: tick.offsetMin * PX_PER_MIN }}
            />
          ))}

          {/* Break bands */}
          {periods.filter(p => p.isBreak).map(p => (
            <div
              key={p.id}
              className="absolute inset-x-0 bg-slate-50 border-y border-slate-100 flex items-center px-3"
              style={{
                top: p.startMin * PX_PER_MIN,
                height: p.durationMin * PX_PER_MIN,
              }}
            >
              <span className="text-[10px] text-slate-400 italic">{p.label}</span>
            </div>
          ))}

          {/* Period cards */}
          {periods.filter(p => !p.isBreak).map(p => {
            const slot = data[day]?.[p.id];
            const isDragSource = dragState?.periodId === p.id && dragState?.day === day;
            const isDropTarget = dropTarget?.periodId === p.id && dropTarget?.day === day;
            const cardTop = p.startMin * PX_PER_MIN;
            const cardH = p.durationMin * PX_PER_MIN;

            return (
              <div
                key={p.id}
                className="absolute inset-x-0 px-1 py-0.5"
                style={{ top: cardTop, height: cardH }}
                onDragOver={e => { e.preventDefault(); onDragOver({ periodId: p.id, day }); }}
                onDrop={e => { e.preventDefault(); onDrop(p.id, day); }}
              >
                <div className="h-full">
                  <SlotCard
                    slot={slot}
                    isDragSource={isDragSource}
                    isDropTarget={isDropTarget}
                    onDragStart={() => slot && onDragStart(p.id, day, slot)}
                    onDragEnd={onDragEnd}
                    large
                    periodLabel={p.label}
                    periodTime={p.time}
                    fillHeight
                    subjectList={subjectList}
                    onDelete={() => onDelete(p.id, day)}
                    onAdd={(subject, teacher) => onAdd(p.id, day, subject, teacher)}
                  />
                </div>
              </div>
            );
          })}

          {/* Now line */}
          {isToday && inSchool && (
            <div
              className="absolute inset-x-0 h-px bg-[#007BFF] z-10 pointer-events-none"
              style={{ top: nowTop }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Slot Card ─────────────────────────────────────────────────────────────────

const SUBJECT_LIST = Object.keys(SUBJECT_STYLES);

function SlotCard({
  slot, isDragSource, isDropTarget, onDragStart, onDragEnd, large, periodLabel, periodTime, fillHeight,
  onDelete, onAdd, subjectList,
}: {
  slot: Slot; isDragSource: boolean; isDropTarget: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  large?: boolean; periodLabel?: string; periodTime?: string; fillHeight?: boolean;
  subjectList: string[];
  onDelete?: () => void;
  onAdd?: (subject: string, teacher: string) => void;
}) {
  const [addSubject, setAddSubject] = useState("");
  const [addTeacher, setAddTeacher] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // Reset subject selection when subjectList changes (class changed)
  useEffect(() => {
    setAddSubject(subjectList[0] ?? "");
  }, [subjectList]);

  if (!slot) {
    return (
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <div
            className={`group rounded-xl border border-dashed transition-all flex items-center justify-center cursor-pointer ${
              isDropTarget ? "border-[#007BFF] bg-blue-50/60" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60"
            } ${fillHeight ? "h-full" : large ? "h-14" : "h-12"}`}
            onDragOver={e => e.preventDefault()}
          >
            {isDropTarget ? (
              <p className="text-[#007BFF] text-[11px] font-medium">Drop here</p>
            ) : (
              <div className="flex items-center gap-1 opacity-30 group-hover:opacity-60 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                  <line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/>
                </svg>
                {fillHeight && <span className="text-[11px] text-slate-400 font-medium">Add class</span>}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="center" side="right">
          <p className="text-[13px] font-semibold text-slate-800 mb-1">Add Class</p>
          {periodLabel && <p className="text-[11px] text-slate-400 mb-3">{periodLabel}{periodTime ? ` · ${periodTime}` : ""}</p>}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Subject</label>
              <Select value={addSubject} onValueChange={setAddSubject}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjectList.map(s => (
                    <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Teacher</label>
              <Input
                className="h-8 text-[12px]"
                placeholder="e.g. R. Sharma"
                value={addTeacher}
                onChange={e => setAddTeacher(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full mt-1 bg-[#007BFF] hover:bg-[#0062cc] text-[12px]"
              disabled={!addTeacher.trim()}
              onClick={() => {
                onAdd?.(addSubject, addTeacher.trim());
                setAddTeacher("");
                setAddOpen(false);
              }}
            >
              Add Class
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const s = C(slot.colorKey);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); onDragStart(); }}
          onDragEnd={onDragEnd}
          className={`group relative rounded-xl cursor-pointer select-none transition-all shadow-xs overflow-hidden ${s.bg} border ${s.border} ${
            isDragSource
              ? "opacity-40 scale-95"
              : isDropTarget
              ? "ring-2 ring-[#007BFF] scale-[1.02] shadow-md"
              : "hover:brightness-95"
          } ${fillHeight ? "h-full" : large ? "min-h-[3.5rem]" : "min-h-[3rem]"}`}
        >
          <div className={`flex ${fillHeight ? "flex-col justify-start px-3 pt-2 pb-2 h-full" : `items-center gap-2 ${large ? "px-3 py-2" : "px-2.5 py-1.5"}`}`}>
            {fillHeight ? (
              <>
                {/* Time range at top */}
                {periodTime && (
                  <p className={`text-[10px] font-medium leading-none mb-1.5 ${s.text} opacity-70`}>{periodTime}</p>
                )}
                {/* Subject */}
                <p className={`font-semibold leading-snug ${s.text} text-[13px]`}>{slot.subject}</p>
                {/* Teacher */}
                <p className={`${s.text} opacity-60 text-[11px] mt-0.5`}>{slot.teacher}</p>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  {/* Time at top for large cards */}
                  {large && periodTime && (
                    <p className={`text-[10px] font-medium leading-none mb-1 ${s.text} opacity-70`}>{periodTime}</p>
                  )}
                  <p className={`font-semibold leading-tight truncate ${s.text} ${large ? "text-[12px]" : "text-[11px]"}`}>
                    {slot.subject}
                  </p>
                  <p className={`truncate mt-0.5 ${s.text} opacity-60 ${large ? "text-[11px]" : "text-[10px]"}`}>
                    {slot.teacher}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="center" side="right">
        {/* Detail header */}
        <div className="flex items-start gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${s.dot}`} />
          <div>
            <p className="text-[14px] font-semibold text-slate-800 leading-tight">{slot.subject}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{slot.teacher}</p>
          </div>
        </div>
        {(periodLabel || periodTime) && (
          <div className="flex items-center gap-1.5 mb-3 bg-slate-50 rounded-lg px-2.5 py-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 shrink-0">
              <circle cx="6" cy="6" r="4.5"/><polyline points="6,3.5 6,6 7.5,7.5"/>
            </svg>
            <span className="text-[11px] text-slate-500 font-mono">{periodLabel}{periodTime ? ` · ${periodTime}` : ""}</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[12px] text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={() => onDelete?.()}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1.5">
            <polyline points="2,3 10,3"/><path d="M4,3V2h4v1"/><path d="M3,3l.7,7.3a.7.7 0 0 0 .7.7h3.2a.7.7 0 0 0 .7-.7L9,3"/>
          </svg>
          Remove Class
        </Button>
      </PopoverContent>
    </Popover>
  );
}
