"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { classesApi, subjectsApi, type Class, type Subject } from "@/lib/api";

const ALL_SECTIONS = ["A", "B", "C", "D", "E"];
const BLANK_CLASS = { name: "", teacher: "", sections: [] as string[], subjects: [] as string[] };

export function ClassDialog({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial: Class | null; onSaved: (c: Class) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm]       = useState<typeof BLANK_CLASS>({ ...BLANK_CLASS });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading]     = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { name: initial.name, teacher: initial.teacher, sections: [...initial.sections], subjects: [...initial.subjects] }
      : { ...BLANK_CLASS });
    setError("");

    const controller = new AbortController();
    setSubjectsLoading(true);
    subjectsApi.list(controller.signal)
      .then((subs) => setAvailableSubjects(subs))
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to load subjects", err);
      })
      .finally(() => setSubjectsLoading(false));

    return () => controller.abort();
  }, [open, initial]);

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Class name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit ? await classesApi.update(initial!.id, form) : await classesApi.create(form);
      onSaved(saved); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save class.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-lg max-h-[90vh] w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Class Name</label>
            <Input placeholder="e.g. Class 7" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-8 text-[13px] bg-white border-slate-200" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Class Teacher</label>
            <Input placeholder="e.g. Mrs. Anita Sen" value={form.teacher}
              onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
              className="h-8 text-[13px] bg-white border-slate-200" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-2">Sections</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_SECTIONS.map((s) => {
                const active = form.sections.includes(s);
                return (
                  <button key={s} onClick={() => setForm((p) => ({ ...p, sections: toggle(p.sections, s) }))}
                    className={`w-9 h-9 rounded-lg text-[13px] font-bold border-2 transition-all
                      ${active ? "bg-[#007BFF] text-white border-[#007BFF]" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <Separator />
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-2">
              Subjects
              <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case">({form.subjects.length} selected)</span>
            </label>
            {subjectsLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-md" />
                ))}
              </div>
            ) : availableSubjects.filter(s => s.status === "active").length === 0 ? (
              <p className="text-[12px] text-slate-400 italic">No subjects created yet. Add subjects in the Subjects tab first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.filter(s => s.status === "active").map((sub) => {
                  const active = form.subjects.includes(sub.name);
                  return (
                    <button key={sub.id} onClick={() => setForm((p) => ({ ...p, subjects: toggle(p.subjects, sub.name) }))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-all
                        ${active ? "bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/30" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                      {active && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Create Class"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
