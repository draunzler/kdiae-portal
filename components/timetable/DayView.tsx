"use client";

import { Badge } from "@/components/ui/badge";
import { type Timetable, type Period, type DragState, type Slot } from "./types";
import { minsToLabel } from "./timeUtils";
import { SlotCard } from "./SlotCard";

interface DayViewProps {
  data: Timetable;
  periods: Period[];
  day: string;
  simMins: number;
  schoolStart: number;
  totalMins: number;
  schoolEnd: number;
  isToday: boolean;
  dragState: DragState | null;
  dropTarget: { periodId: string; day: string } | null;
  subjectList: string[];
  onDragStart: (p: string, d: string, s: NonNullable<Slot>) => void;
  onDrop: (p: string, d: string) => void;
  onDragOver: (t: { periodId: string; day: string } | null) => void;
  onDragEnd: () => void;
  onDelete: (periodId: string, day: string) => void;
  onAdd: (periodId: string, day: string, subject: string, teacher: string) => void;
}

export function DayView({
  data, periods, day, simMins, schoolStart, totalMins, schoolEnd, isToday,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd, onDelete, onAdd, subjectList,
}: DayViewProps) {
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
        {isToday && (
          <Badge className="bg-blue-50 text-[#007BFF] border-blue-200 text-[10px] font-semibold px-2 py-0.5">Today</Badge>
        )}
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
            <div className="absolute -right-3 z-20" style={{ top: nowTop }}>
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
              style={{ top: p.startMin * PX_PER_MIN, height: p.durationMin * PX_PER_MIN }}
            >
              <span className="text-[10px] text-slate-400 italic">{p.label}</span>
            </div>
          ))}

          {/* Period cards */}
          {periods.filter(p => !p.isBreak).map(p => {
            const slot = data[day]?.[p.id];
            const isDragSource = dragState?.periodId === p.id && dragState?.day === day;
            const isDropTarget = dropTarget?.periodId === p.id && dropTarget?.day === day;

            return (
              <div
                key={p.id}
                className="absolute inset-x-0 px-1 py-0.5"
                style={{ top: p.startMin * PX_PER_MIN, height: p.durationMin * PX_PER_MIN }}
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
