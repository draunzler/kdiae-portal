"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { subjectsApi, type Subject } from "@/lib/api";

const BLANK_SUB = { name: "", code: "", description: "" };

export function SubjectDialog({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial: Subject | null; onSaved: (s: Subject) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm]     = useState<typeof BLANK_SUB>({ ...BLANK_SUB });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { name: initial.name, code: initial.code, description: initial.description } : { ...BLANK_SUB });
      setError("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Subject name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit ? await subjectsApi.update(initial!.id, form) : await subjectsApi.create(form);
      onSaved(saved); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save subject.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-md w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Subject Name</label>
            <Input placeholder="e.g. Mathematics" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-8 text-[13px] bg-white border-slate-200" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Short Code <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <Input placeholder="e.g. MATH" value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className="h-8 text-[13px] bg-white border-slate-200 font-mono uppercase" maxLength={8} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Description <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <Textarea placeholder="Brief description of the subject…" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="text-[13px] bg-white border-slate-200 resize-none min-h-[72px]" />
          </div>
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Add Subject"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
