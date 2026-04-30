"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";

export function LDatePicker({ label, field, value, onChange }: {
  label: string;
  field: string;
  value: string;
  onChange: (f: string, v: string) => void;
}) {
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center gap-2 w-full h-8 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-left hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <FontAwesomeIcon icon={faCalendar} className="text-slate-400 text-[11px] shrink-0" />
            <span className={selected ? "text-slate-800" : "text-slate-400"}>
              {selected ? format(selected, "dd MMM yyyy") : "Pick a date…"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => onChange(field, d ? format(d, "yyyy-MM-dd") : "")}
            captionLayout="dropdown"
            fromYear={1990}
            toYear={2030}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
