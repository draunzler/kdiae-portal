"use client";

import { useState } from "react";
import { type PeriodDef } from "@/lib/api";
import { type Timetable, type Period, type DragState, type Slot } from "./types";
import { minsToLabel, parseTimeToAbsMins } from "./timeUtils";
import { SlotCard } from "./SlotCard";

interface WeekViewProps {
  data: Timetable;
  periods: Period[];
  periodDefs: PeriodDef[];
  days: string[];
  simMins: number;
  schoolStart: number;
  totalMins: number;
  todayName: string;
  dragState: DragState | null;
  dropTarget: { periodId: string; day: string } | null;
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
}

export function WeekView({
  data, periods, periodDefs, days, simMins, schoolStart, totalMins, todayName,
  dragState, dropTarget, onDragStart, onDrop, onDragOver, onDragEnd, onDelete, onAdd,
  onUpdatePeriodDef, onDeletePeriodRow, onAddPeriodRow, onReorderPeriod, subjectList,
}: WeekViewProps) {
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
                      {[0, 1, 2].map(i => (
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
