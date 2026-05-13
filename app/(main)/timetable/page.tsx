"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { timetableApi, scheduleApi, classesApi, type PeriodDef, type Class } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { type Slot, type Timetable, type DragState } from "@/components/timetable/types";
import { DAYS, DAY_SHORT, CLASSES, SUBJECT_STYLES, defaultDefsForClass } from "@/components/timetable/constants";
import {
  buildPeriodsFromDefs, schoolStartFromDefs, schoolEndFromDefs,
  emptyTimetableFromDefs, nowToMinutes, entryKey, absMinsToTimeStr, parseTimeToAbsMins,
} from "@/components/timetable/timeUtils";
import { TimeRuler } from "@/components/timetable/TimeRuler";
import { WeekView } from "@/components/timetable/WeekView";
import { DayView } from "@/components/timetable/DayView";

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