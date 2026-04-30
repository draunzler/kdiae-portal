"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LSelect({ label, field, value, options, onChange }: {
  label: string;
  field: string;
  value: string;
  options: string[];
  onChange: (f: string, v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(field, v)}>
        <SelectTrigger
          className="h-8 text-[13px] bg-white border-slate-200 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
