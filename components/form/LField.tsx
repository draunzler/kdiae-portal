"use client";

import { Input } from "@/components/ui/input";

export function LField({ label, field, value, onChange, placeholder = "" }: {
  label: string;
  field: string;
  value: string | number;
  onChange: (f: string, v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="h-8 text-[13px] bg-white border-slate-200"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
