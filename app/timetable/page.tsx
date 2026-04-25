"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

type Slot = { subject: string; teacher: string; colorKey: string } | null;
type DaySchedule = Record<string, Slot>;
type Timetable = Record<string, DaySchedule>;

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Minutes from 8:00 AM start
const SCHOOL_START = 8 * 60; // 480 min
const SCHOOL_END   = 13 * 60 + 30; // 810 min
const TOTAL_MINS   = SCHOOL_END - SCHOOL_START; // 330 min

type Period = {
  id: string;
  label: string;
  time: string;
  startMin: number; // minutes from 8:00
  durationMin: number;
  isBreak?: boolean;
};

const PERIODS: Period[] = [
  { id: "P1",    label: "Period 1", time: "8:00 – 8:45",    startMin: 0,   durationMin: 45 },
  { id: "P2",    label: "Period 2", time: "8:45 – 9:30",    startMin: 45,  durationMin: 45 },
  { id: "BRK1",  label: "Break",    time: "9:30 – 9:45",    startMin: 90,  durationMin: 15, isBreak: true },
  { id: "P3",    label: "Period 3", time: "9:45 – 10:30",   startMin: 105, durationMin: 45 },
  { id: "P4",    label: "Period 4", time: "10:30 – 11:15",  startMin: 150, durationMin: 45 },
  { id: "LCH",   label: "Lunch",    time: "11:15 – 12:00",  startMin: 195, durationMin: 45, isBreak: true },
  { id: "P5",    label: "Period 5", time: "12:00 – 12:45",  startMin: 240, durationMin: 45 },
  { id: "P6",    label: "Period 6", time: "12:45 – 1:30",   startMin: 285, durationMin: 45 },
];

const SUBJECT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Mathematics:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    dot: "bg-blue-400"    },
  Science:        { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  English:        { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-800",  dot: "bg-violet-400"  },
  "Social Studies":{ bg: "bg-amber-50",  border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400"   },
  Hindi:          { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-800",    dot: "bg-rose-400"    },
  "Computer Sc.": { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-800",    dot: "bg-cyan-400"    },
  "Phys. Ed.":    { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400"  },
  Art:            { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-800",    dot: "bg-pink-400"    },
};

const C = (key: string) => SUBJECT_STYLES[key] ?? SUBJECT_STYLES["Mathematics"];

// ── Timetable Data ────────────────────────────────────────────────────────────

const INITIAL_DATA: Record<string, Timetable> = {
  "Class 6": {
    Monday:    { P1: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P2: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P3: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P4: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P5: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P6: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             } },
    Tuesday:   { P1: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P2: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P3: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P4: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P5: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    }, P6: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  } },
    Wednesday: { P1: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P2: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P3: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P4: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P5: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             }, P6: { subject: "Phys. Ed.",      teacher: "K. Sen",         colorKey: "Phys. Ed."       } },
    Thursday:  { P1: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P2: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    }, P3: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P4: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P5: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P6: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  } },
    Friday:    { P1: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    }, P2: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P3: { subject: "Phys. Ed.",      teacher: "K. Sen",         colorKey: "Phys. Ed."       }, P4: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             }, P5: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P6: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         } },
  },
  "Class 5": {
    Monday:    { P1: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P2: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P3: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P4: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P5: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P6: { subject: "Phys. Ed.",      teacher: "K. Sen",         colorKey: "Phys. Ed."       } },
    Tuesday:   { P1: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P2: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P3: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P4: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P5: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             }, P6: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  } },
    Wednesday: { P1: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P2: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P3: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           }, P4: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P5: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    }, P6: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         } },
    Thursday:  { P1: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P2: { subject: "Science",        teacher: "S. Das",         colorKey: "Science"         }, P3: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             }, P4: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    }, P5: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P6: { subject: "Hindi",          teacher: "M. Gupta",       colorKey: "Hindi"           } },
    Friday:    { P1: { subject: "English",        teacher: "P. Mukherjee",   colorKey: "English"         }, P2: { subject: "Art",            teacher: "D. Roy",         colorKey: "Art"             }, P3: { subject: "Social Studies", teacher: "A. Bose",        colorKey: "Social Studies"  }, P4: { subject: "Mathematics",    teacher: "R. Sharma",      colorKey: "Mathematics"     }, P5: { subject: "Phys. Ed.",      teacher: "K. Sen",         colorKey: "Phys. Ed."       }, P6: { subject: "Computer Sc.",   teacher: "N. Chatterjee",  colorKey: "Computer Sc."    } },
  },
};

const CLASSES = ["Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"];

function getFallback(cls: string): Timetable {
  return INITIAL_DATA[cls] ?? INITIAL_DATA["Class 6"];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowToMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() - SCHOOL_START;
}

function minutesToTimeStr(mins: number): string {
  const totalMins = SCHOOL_START + mins;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getCurrentPeriod(mins: number): Period | null {
  return PERIODS.find(p => !p.isBreak && mins >= p.startMin && mins < p.startMin + p.durationMin) ?? null;
}

// ── Drag ghost ────────────────────────────────────────────────────────────────

interface DragState {
  periodId: string;
  day: string;
  slot: NonNullable<Slot>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("Class 6");
  const [timetables, setTimetables] = useState<Record<string, Timetable>>(
    Object.fromEntries(CLASSES.map(c => [c, getFallback(c)]))
  );
  const [currentMins, setCurrentMins] = useState<number>(nowToMinutes());
  const [simMins, setSimMins] = useState<number>(Math.max(0, Math.min(TOTAL_MINS, nowToMinutes())));
  const [isLive, setIsLive] = useState(true);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ periodId: string; day: string } | null>(null);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  const data = timetables[selectedClass] ?? getFallback(selectedClass);

  // Live clock tick
  useEffect(() => {
    const id = setInterval(() => {
      const mins = nowToMinutes();
      setCurrentMins(mins);
      if (isLive) setSimMins(Math.max(0, Math.min(TOTAL_MINS, mins)));
    }, 30000);
    return () => clearInterval(id);
  }, [isLive]);

  // Drag handlers
  const handleDragStart = useCallback((periodId: string, day: string, slot: NonNullable<Slot>) => {
    setDragState({ periodId, day, slot });
  }, []);

  const handleDrop = useCallback((targetPeriodId: string, targetDay: string) => {
    if (!dragState) return;
    const { periodId: srcPeriodId, day: srcDay, slot } = dragState;
    if (srcPeriodId === targetPeriodId && srcDay === targetDay) {
      setDragState(null);
      setDropTarget(null);
      return;
    }
    setTimetables(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      const srcSlot = next[selectedClass][srcDay][srcPeriodId];
      const tgtSlot = next[selectedClass][targetDay][targetPeriodId];
      next[selectedClass][srcDay][srcPeriodId] = tgtSlot ?? null;
      next[selectedClass][targetDay][targetPeriodId] = srcSlot;
      return next;
    });
    setDragState(null);
    setDropTarget(null);
  }, [dragState, selectedClass]);

  const activePeriod = getCurrentPeriod(simMins);
  const sliderPct = (simMins / TOTAL_MINS) * 100;

  // Today's weekday name for highlighting
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const todayIdx = DAYS.indexOf(todayName);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Timetable" description="Weekly class schedule" />

        <main className="flex-1 overflow-y-auto">
          {/* Time bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center gap-4">
              {/* Live badge */}
              <button
                onClick={() => {
                  setIsLive(true);
                  setSimMins(Math.max(0, Math.min(TOTAL_MINS, nowToMinutes())));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  isLive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                LIVE
              </button>

              {/* Current time */}
              <span className="text-[12px] font-mono font-semibold text-slate-600 w-20">
                {minutesToTimeStr(simMins)}
              </span>

              {/* Slider */}
              <div className="flex-1 relative flex items-center">
                {/* Period markers */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  {PERIODS.map(p => (
                    <div
                      key={p.id}
                      className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-sm ${
                        p.isBreak ? "bg-slate-100 border border-slate-200" : "bg-blue-50 border border-blue-100"
                      }`}
                      style={{
                        left: `${(p.startMin / TOTAL_MINS) * 100}%`,
                        width: `${(p.durationMin / TOTAL_MINS) * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <input
                  type="range"
                  min={0}
                  max={TOTAL_MINS}
                  value={simMins}
                  onChange={e => {
                    setSimMins(Number(e.target.value));
                    setIsLive(false);
                  }}
                  className="w-full relative z-10 h-4 accent-[#007BFF] cursor-pointer"
                  style={{ background: "transparent" }}
                />
              </div>

              {/* End time */}
              <span className="text-[11px] text-slate-400 w-16 text-right font-mono">1:30 PM</span>

              {/* Active period pill */}
              {activePeriod ? (
                <div className="flex items-center gap-2 bg-[#007BFF] text-white rounded-full px-3 py-1 text-[11px] font-semibold">
                  <span>{activePeriod.label}</span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-90">{activePeriod.time}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 text-slate-500 rounded-full px-3 py-1 text-[11px] font-semibold">
                  Outside hours
                </div>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
                  {(["week", "day"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all capitalize ${
                        viewMode === v
                          ? "bg-[#007BFF] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {/* Day selector (day view only) */}
                {viewMode === "day" && (
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => setActiveDay(d)}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          activeDay === d
                            ? "bg-[#007BFF] text-white"
                            : d === todayName
                            ? "text-[#007BFF] bg-blue-50"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {DAY_SHORT[i]}
                      </button>
                    ))}
                  </div>
                )}
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
                    {CLASSES.map(c => (
                      <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timetable */}
            <Card className="shadow-none border-slate-200 overflow-hidden">
              {viewMode === "week" ? (
                <WeekView
                  data={data}
                  periods={PERIODS}
                  days={DAYS}
                  simMins={simMins}
                  todayName={todayName}
                  dragState={dragState}
                  dropTarget={dropTarget}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragOver={setDropTarget}
                  onDragEnd={() => { setDragState(null); setDropTarget(null); }}
                />
              ) : (
                <DayView
                  data={data}
                  periods={PERIODS}
                  day={activeDay}
                  simMins={simMins}
                  isToday={activeDay === todayName}
                  dragState={dragState}
                  dropTarget={dropTarget}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragOver={setDropTarget}
                  onDragEnd={() => { setDragState(null); setDropTarget(null); }}
                />
              )}
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(SUBJECT_STYLES).map(([subj, s]) => (
                <span key={subj} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${s.bg} ${s.border} ${s.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {subj}
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  data, periods, days, simMins, todayName,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd,
}: {
  data: Timetable; periods: Period[]; days: string[]; simMins: number; todayName: string;
  dragState: DragState | null; dropTarget: { periodId: string; day: string } | null;
  onDragStart: (p: string, d: string, s: NonNullable<Slot>) => void;
  onDrop: (p: string, d: string) => void;
  onDragOver: (t: { periodId: string; day: string } | null) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="py-3 px-4 text-left w-32">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Time</span>
            </th>
            {days.map(d => (
              <th key={d} className={`py-3 px-2 text-center ${d === todayName ? "bg-blue-50/60" : ""}`}>
                <div className={`text-[12px] font-semibold ${d === todayName ? "text-[#007BFF]" : "text-slate-600"}`}>{d}</div>
                {d === todayName && (
                  <div className="text-[10px] text-[#007BFF] opacity-70 mt-0.5">Today</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(p => {
            const isCurrentPeriod = !p.isBreak && simMins >= p.startMin && simMins < p.startMin + p.durationMin;
            return (
              <tr
                key={p.id}
                className={`border-b border-slate-100 transition-colors ${
                  isCurrentPeriod
                    ? "bg-blue-50/40"
                    : p.isBreak
                    ? "bg-slate-50/80"
                    : "hover:bg-slate-50/50"
                }`}
              >
                {/* Period label */}
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    {isCurrentPeriod && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF] animate-pulse shrink-0" />
                    )}
                    <div>
                      <p className={`text-[12px] font-semibold ${isCurrentPeriod ? "text-[#007BFF]" : "text-slate-700"}`}>
                        {p.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.time}</p>
                    </div>
                  </div>
                </td>

                {/* Slots */}
                {p.isBreak
                  ? days.map(d => (
                      <td key={d} className={`py-2 px-2 text-center ${d === todayName ? "bg-blue-50/30" : ""}`}>
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
                          className={`py-1.5 px-2 ${d === todayName ? "bg-blue-50/20" : ""}`}
                          onDragOver={e => { e.preventDefault(); onDragOver({ periodId: p.id, day: d }); }}
                          onDrop={e => { e.preventDefault(); onDrop(p.id, d); }}
                        >
                          <SlotCard
                            slot={slot}
                            isDragSource={isDragSource}
                            isDropTarget={isDropTarget}
                            onDragStart={() => slot && onDragStart(p.id, d, slot)}
                            onDragEnd={onDragEnd}
                          />
                        </td>
                      );
                    })
                }
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Time slider overlay line */}
      <TimeIndicatorBar simMins={simMins} periods={periods} />
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  data, periods, day, simMins, isToday,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd,
}: {
  data: Timetable; periods: Period[]; day: string; simMins: number; isToday: boolean;
  dragState: DragState | null; dropTarget: { periodId: string; day: string } | null;
  onDragStart: (p: string, d: string, s: NonNullable<Slot>) => void;
  onDrop: (p: string, d: string) => void;
  onDragOver: (t: { periodId: string; day: string } | null) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-[15px] font-semibold text-slate-800">{day}</h3>
        {isToday && <Badge className="bg-blue-50 text-[#007BFF] border-blue-200 text-[10px] font-semibold px-2 py-0.5">Today</Badge>}
      </div>

      {periods.map(p => {
        const isCurrentPeriod = !p.isBreak && simMins >= p.startMin && simMins < p.startMin + p.durationMin;
        const slot = data[day]?.[p.id];
        const isDragSource = dragState?.periodId === p.id && dragState?.day === day;
        const isDropTarget = dropTarget?.periodId === p.id && dropTarget?.day === day;

        if (p.isBreak) {
          return (
            <div key={p.id} className="flex items-center gap-3 py-1">
              <div className="w-24 shrink-0 text-right">
                <span className="text-[10px] text-slate-400 font-mono">{p.time}</span>
              </div>
              <div className="flex-1 h-px bg-slate-200 relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-100 border border-slate-200 text-slate-400 text-[10px] px-2 py-0.5 rounded-full italic">{p.label}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
              isCurrentPeriod ? "bg-blue-50 ring-1 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"
            }`}
            onDragOver={e => { e.preventDefault(); onDragOver({ periodId: p.id, day }); }}
            onDrop={e => { e.preventDefault(); onDrop(p.id, day); }}
          >
            {/* Time col */}
            <div className="w-24 shrink-0 text-right">
              <div className={`text-[12px] font-semibold ${isCurrentPeriod ? "text-[#007BFF]" : "text-slate-600"}`}>{p.label}</div>
              <div className="text-[10px] text-slate-400 font-mono">{p.time}</div>
            </div>

            {/* Progress bar */}
            <div className="w-1 self-stretch rounded-full bg-slate-200 relative overflow-hidden shrink-0">
              {isCurrentPeriod && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[#007BFF] transition-all duration-1000 rounded-full"
                  style={{ height: `${((simMins - p.startMin) / p.durationMin) * 100}%` }}
                />
              )}
            </div>

            {/* Slot */}
            <div className="flex-1">
              <SlotCard
                slot={slot}
                isDragSource={isDragSource}
                isDropTarget={isDropTarget}
                onDragStart={() => slot && onDragStart(p.id, day, slot)}
                onDragEnd={onDragEnd}
                large
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Slot Card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot, isDragSource, isDropTarget, onDragStart, onDragEnd, large,
}: {
  slot: Slot; isDragSource: boolean; isDropTarget: boolean;
  onDragStart: () => void; onDragEnd: () => void; large?: boolean;
}) {
  if (!slot) {
    return (
      <div
        className={`rounded-lg border border-dashed transition-all ${
          isDropTarget
            ? "border-[#007BFF] bg-blue-50 scale-105"
            : "border-slate-200 bg-white"
        } ${large ? "px-4 py-3" : "px-2 py-1.5"} text-center`}
        onDragOver={e => e.preventDefault()}
      >
        <p className={`text-slate-300 ${large ? "text-[13px]" : "text-[11px]"}`}>
          {isDropTarget ? "Drop here" : "—"}
        </p>
      </div>
    );
  }

  const s = C(slot.colorKey);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all ${s.bg} ${s.border} ${s.text} ${
        isDragSource ? "opacity-40 scale-95" : isDropTarget ? "ring-2 ring-[#007BFF] scale-105" : "hover:shadow-sm hover:-translate-y-0.5"
      } ${large ? "px-4 py-3" : "px-2 py-1.5"}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className={`font-semibold leading-tight ${large ? "text-[13px]" : "text-[12px]"}`}>{slot.subject}</p>
          <p className={`opacity-70 mt-0.5 ${large ? "text-[12px]" : "text-[10px]"}`}>{slot.teacher}</p>
        </div>
        {large && (
          <svg className="opacity-30 mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="3" height="3" rx="1"/><rect x="7" y="2" width="3" height="3" rx="1"/>
            <rect x="2" y="7" width="3" height="3" rx="1"/><rect x="7" y="7" width="3" height="3" rx="1"/>
            <rect x="2" y="10.5" width="3" height="1.5" rx="0.75"/><rect x="7" y="10.5" width="3" height="1.5" rx="0.75"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Time indicator ────────────────────────────────────────────────────────────

function TimeIndicatorBar({ simMins, periods }: { simMins: number; periods: Period[] }) {
  const isInSchoolHours = simMins >= 0 && simMins <= TOTAL_MINS;
  if (!isInSchoolHours) return null;

  // Find which table row this falls in — we can't do a real overlay easily in a table,
  // so we show a sticky label at the top instead
  const activePeriod = periods.find(p => !p.isBreak && simMins >= p.startMin && simMins < p.startMin + p.durationMin);
  if (!activePeriod) return null;

  const progressInPeriod = ((simMins - activePeriod.startMin) / activePeriod.durationMin) * 100;

  return (
    <div className="px-4 py-2 border-t border-slate-100 bg-blue-50/50">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#007BFF] font-semibold">{activePeriod.label} in progress</span>
        <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007BFF] rounded-full transition-all duration-500"
            style={{ width: `${progressInPeriod}%` }}
          />
        </div>
        <span className="text-[11px] text-[#007BFF] font-mono">{Math.round(progressInPeriod)}%</span>
      </div>
    </div>
  );
}