"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faFileLines, faUsers, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { icon: faUser,      label: "Personal Info" },
  { icon: faFileLines, label: "Documents"     },
  { icon: faUsers,     label: "Guardian"      },
];

export { STEPS };

export function StepperHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 min-w-[64px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] transition-colors
              ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#007BFF] text-white" : "bg-slate-100 text-slate-400"}`}>
              {i < step
                ? <FontAwesomeIcon icon={faCircleCheck} />
                : <FontAwesomeIcon icon={s.icon} />}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${i === step ? "text-[#007BFF]" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
