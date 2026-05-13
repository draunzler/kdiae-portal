"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type Slot } from "./types";
import { subjectStyle } from "./constants";

interface SlotCardProps {
  slot: Slot;
  isDragSource: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  large?: boolean;
  periodLabel?: string;
  periodTime?: string;
  fillHeight?: boolean;
  subjectList: string[];
  onDelete?: () => void;
  onAdd?: (subject: string, teacher: string) => void;
}

export function SlotCard({
  slot, isDragSource, isDropTarget, onDragStart, onDragEnd,
  large, periodLabel, periodTime, fillHeight,
  onDelete, onAdd, subjectList,
}: SlotCardProps) {
  const [addSubject, setAddSubject] = useState("");
  const [addTeacher, setAddTeacher] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setAddSubject(subjectList[0] ?? "");
  }, [subjectList]);

  if (!slot) {
    return (
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <div
            className={`group rounded-xl border border-dashed transition-all flex items-center justify-center cursor-pointer ${
              isDropTarget ? "border-[#007BFF] bg-blue-50/60" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60"
            } ${fillHeight ? "h-full" : large ? "h-14" : "h-12"}`}
            onDragOver={e => e.preventDefault()}
          >
            {isDropTarget ? (
              <p className="text-[#007BFF] text-[11px] font-medium">Drop here</p>
            ) : (
              <div className="flex items-center gap-1 opacity-30 group-hover:opacity-60 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                  <line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/>
                </svg>
                {fillHeight && <span className="text-[11px] text-slate-400 font-medium">Add class</span>}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="center" side="right">
          <p className="text-[13px] font-semibold text-slate-800 mb-1">Add Class</p>
          {periodLabel && (
            <p className="text-[11px] text-slate-400 mb-3">{periodLabel}{periodTime ? ` · ${periodTime}` : ""}</p>
          )}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Subject</label>
              <Select value={addSubject} onValueChange={setAddSubject}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjectList.map(s => (
                    <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Teacher</label>
              <Input
                className="h-8 text-[12px]"
                placeholder="e.g. R. Sharma"
                value={addTeacher}
                onChange={e => setAddTeacher(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full mt-1 bg-[#007BFF] hover:bg-[#0062cc] text-[12px]"
              disabled={!addTeacher.trim()}
              onClick={() => {
                onAdd?.(addSubject, addTeacher.trim());
                setAddTeacher("");
                setAddOpen(false);
              }}
            >
              Add Class
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const s = subjectStyle(slot.colorKey);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); onDragStart(); }}
          onDragEnd={onDragEnd}
          className={`group relative rounded-xl cursor-pointer select-none transition-all shadow-xs overflow-hidden ${s.bg} border ${s.border} ${
            isDragSource
              ? "opacity-40 scale-95"
              : isDropTarget
              ? "ring-2 ring-[#007BFF] scale-[1.02] shadow-md"
              : "hover:brightness-95"
          } ${fillHeight ? "h-full" : large ? "min-h-[3.5rem]" : "min-h-[3rem]"}`}
        >
          <div className={`flex ${fillHeight ? "flex-col justify-start px-3 pt-2 pb-2 h-full" : `items-center gap-2 ${large ? "px-3 py-2" : "px-2.5 py-1.5"}`}`}>
            {fillHeight ? (
              <>
                {periodTime && (
                  <p className={`text-[10px] font-medium leading-none mb-1.5 ${s.text} opacity-70`}>{periodTime}</p>
                )}
                <p className={`font-semibold leading-snug ${s.text} text-[13px]`}>{slot.subject}</p>
                <p className={`${s.text} opacity-60 text-[11px] mt-0.5`}>{slot.teacher}</p>
              </>
            ) : (
              <div className="flex-1 min-w-0">
                {large && periodTime && (
                  <p className={`text-[10px] font-medium leading-none mb-1 ${s.text} opacity-70`}>{periodTime}</p>
                )}
                <p className={`font-semibold leading-tight truncate ${s.text} ${large ? "text-[12px]" : "text-[11px]"}`}>
                  {slot.subject}
                </p>
                <p className={`truncate mt-0.5 ${s.text} opacity-60 ${large ? "text-[11px]" : "text-[10px]"}`}>
                  {slot.teacher}
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="center" side="right">
        <div className="flex items-start gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${s.dot}`} />
          <div>
            <p className="text-[14px] font-semibold text-slate-800 leading-tight">{slot.subject}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{slot.teacher}</p>
          </div>
        </div>
        {(periodLabel || periodTime) && (
          <div className="flex items-center gap-1.5 mb-3 bg-slate-50 rounded-lg px-2.5 py-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 shrink-0">
              <circle cx="6" cy="6" r="4.5"/><polyline points="6,3.5 6,6 7.5,7.5"/>
            </svg>
            <span className="text-[11px] text-slate-500 font-mono">{periodLabel}{periodTime ? ` · ${periodTime}` : ""}</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[12px] text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={() => onDelete?.()}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1.5">
            <polyline points="2,3 10,3"/><path d="M4,3V2h4v1"/><path d="M3,3l.7,7.3a.7.7 0 0 0 .7.7h3.2a.7.7 0 0 0 .7-.7L9,3"/>
          </svg>
          Remove Class
        </Button>
      </PopoverContent>
    </Popover>
  );
}
