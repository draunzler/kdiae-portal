"use client";

import { type Period } from "./types";
import { minsToLabel } from "./timeUtils";

interface TimeRulerProps {
  simMins: number;
  periods: Period[];
  schoolStart: number;
  schoolEnd: number;
  totalMins: number;
}

export function TimeRuler({ simMins, periods, schoolStart, schoolEnd, totalMins }: TimeRulerProps) {
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
