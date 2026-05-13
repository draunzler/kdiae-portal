"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { transportApi, type TransportDriver, type TransportVehicle } from "@/lib/api";
import { Field, SelectField } from "./FormFields";

const BLANK: Omit<TransportDriver, "id"> = {
  name: "", phone: "", license: "", assigned_bus: "", status: "Active",
};

export function DriverDialog({
  open, onClose, initial, onSaved, vehicles,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportDriver | null;
  onSaved: (d: TransportDriver) => void;
  vehicles: TransportVehicle[];
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, phone: initial.phone, license: initial.license, assigned_bus: initial.assigned_bus, status: initial.status }
        : { ...BLANK });
      setError("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim())    { setError("Name is required."); return; }
    if (!form.license.trim()) { setError("License number is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit
        ? await transportApi.updateDriver(initial!.id, form)
        : await transportApi.createDriver(form);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save driver.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-md w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Driver" : "Add New Driver"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Field label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Ramesh Kumar" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
          <Field label="License Number" value={form.license} onChange={(v) => setForm((p) => ({ ...p, license: v }))} placeholder="e.g. WB-1234567890123" />
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Assigned Vehicle</label>
            <Select
              value={form.assigned_bus || "__none__"}
              onValueChange={(v) => setForm((p) => ({ ...p, assigned_bus: v === "__none__" ? "" : v }))}
            >
              <SelectTrigger className="h-8 text-[13px] bg-white border-slate-200">
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-[13px] text-slate-400">— None —</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.bus_number} className="text-[13px]">
                    {v.bus_number}{v.model ? ` · ${v.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SelectField label="Status" value={form.status} options={["Active", "Off Duty"]} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Add Driver"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
