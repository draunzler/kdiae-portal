"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export function FileField({ label, accept = "*" }: { label: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <div
        className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-md px-3 py-2 hover:border-[#007BFF] hover:bg-blue-50/40 transition-colors"
        onClick={() => ref.current?.click()}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} className="text-slate-300 text-[13px]" />
        <span className={`text-[12px] truncate ${name ? "text-slate-700" : "text-slate-400"}`}>
          {name ?? "Click to upload…"}
        </span>
        {name && <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-[12px] ml-auto shrink-0" />}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => setName(e.target.files?.[0]?.name ?? null)} />
    </div>
  );
}
