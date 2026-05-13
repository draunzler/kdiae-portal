"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { transportApi, type TransportVehicle, type TransportDriver } from "@/lib/api";
import { Field, SelectField } from "./FormFields";

const BLANK: Omit<TransportVehicle, "id"> = {
  bus_number: "", model: "", type: "Bus", capacity: 0, driver: "", status: "Active", last_service: "",
};

export function VehicleDialog({
  open, onClose, initial, onSaved, drivers,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportVehicle | null;
  onSaved: (v: TransportVehicle) => void;
  drivers: TransportDriver[];
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { bus_number: initial.bus_number, model: initial.model, type: initial.type, capacity: initial.capacity, driver: initial.driver, status: initial.status, last_service: initial.last_service }
        : { ...BLANK });
      setError("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.bus_number.trim()) { setError("Bus number is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit
        ? await transportApi.updateVehicle(initial!.id, form)
        : await transportApi.createVehicle(form);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-lg w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-2 gap-4">
          <Field label="Bus / Vehicle Number" value={form.bus_number} onChange={(v) => setForm((p) => ({ ...p, bus_number: v }))} placeholder="e.g. WB 12 AB 1234" />
          <Field label="Model" value={form.model} onChange={(v) => setForm((p) => ({ ...p, model: v }))} placeholder="e.g. Tata Starbus" />
          <Field label="Capacity" value={form.capacity || ""} onChange={(v) => setForm((p) => ({ ...p, capacity: Number(v) || 0 }))} type="number" placeholder="e.g. 40" />
          <Field label="Last Service Date" value={form.last_service} onChange={(v) => setForm((p) => ({ ...p, last_service: v }))} placeholder="e.g. Jan 10, 2026" />
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Assigned Driver</label>
            {isEdit ? (
              <select
                value={form.driver}
                onChange={(e) => setForm((p) => ({ ...p, driver: e.target.value }))}
                className="w-full h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007BFF]/30"
              >
                <option value="">— None —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}{d.license ? ` · ${d.license}` : ""}</option>
                ))}
              </select>
            ) : (
              <Input
                value=""
                disabled
                placeholder="Save vehicle first, then assign a driver"
                className="h-8 text-[13px] bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              />
            )}
          </div>
          <div className="col-span-2">
            <SelectField label="Type" value={form.type} options={["Bus", "Mini-Bus", "Van"]} onChange={(v) => setForm((p) => ({ ...p, type: v }))} />
          </div>
          <div className="col-span-2">
            <SelectField label="Status" value={form.status} options={["Active", "Maintenance", "Suspended"]} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
          </div>
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Add Vehicle"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
