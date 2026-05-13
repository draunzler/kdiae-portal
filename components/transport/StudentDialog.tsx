"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { transportApi, type TransportStudent } from "@/lib/api";
import { Field, SelectField } from "./FormFields";

const BLANK: Omit<TransportStudent, "id"> = {
  name: "", class_name: "", status: "Active",
};

export function StudentDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportStudent | null;
  onSaved: (s: TransportStudent) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, class_name: initial.class_name, status: initial.status }
        : { ...BLANK });
      setError("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Student name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit
        ? await transportApi.updateStudent(initial!.id, form)
        : await transportApi.createStudent(form);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-md w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Field label="Student Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Arjun Das" />
          <Field label="Class" value={form.class_name} onChange={(v) => setForm((p) => ({ ...p, class_name: v }))} placeholder="e.g. Class 8A" />
          <SelectField label="Status" value={form.status} options={["Active", "Suspended"]} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Add Student"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
