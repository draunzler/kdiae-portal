"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBus, faPlus, faLocationDot, faPencil, faTrash,
  faSpinner, faCheck, faIdCard, faCar,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  transportApi,
  type TransportRoute, type TransportStudent,
  type TransportDriver, type TransportVehicle,
} from "@/lib/api";

// ── Colour maps ───────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  Active:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Suspended:   "bg-red-50 text-red-700 border-red-200",
  "Off Duty":  "bg-amber-50 text-amber-700 border-amber-200",
  Maintenance: "bg-orange-50 text-orange-700 border-orange-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_CLS[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

// ── Generic field row ─────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder = "", type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-[13px] bg-white border-slate-200"
      />
    </div>
  );
}

// ── SelectField ───────────────────────────────────────────────────────────────

function SelectField({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded text-[12px] font-medium border-2 transition-all
              ${value === o
                ? "border-[#007BFF] bg-[#007BFF]/10 text-[#007BFF]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══ Route Dialog ══════════════════════════════════════════════════════════════

const BLANK_ROUTE: Omit<TransportRoute, "id"> = {
  name: "", bus: "", time: "", stops: [], driver: "", phone: "", capacity: 0, students: 0,
};

function RouteDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportRoute | null;
  onSaved: (r: TransportRoute) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK_ROUTE });
  const [stopsRaw, setStopsRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ name: initial.name, bus: initial.bus, time: initial.time, stops: initial.stops, driver: initial.driver, phone: initial.phone, capacity: initial.capacity, students: initial.students });
        setStopsRaw(initial.stops.join(", "));
      } else {
        setForm({ ...BLANK_ROUTE });
        setStopsRaw("");
      }
      setError("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Route name is required."); return; }
    if (!form.bus.trim())  { setError("Bus number is required."); return; }
    setSaving(true); setError("");
    const payload = { ...form, stops: stopsRaw.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      const saved = isEdit
        ? await transportApi.updateRoute(initial!.id, payload)
        : await transportApi.createRoute(payload);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save route.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-lg w-[calc(100vw-1.5rem)] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="px-6 pt-6 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">{isEdit ? "Edit Route" : "Add New Route"}</DialogTitle>
          </DialogHeader>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Route Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Pandua Express" />
          </div>
          <Field label="Bus Number" value={form.bus} onChange={(v) => setForm((p) => ({ ...p, bus: v }))} placeholder="e.g. WB 12 AB 1234" />
          <Field label="Departure Time" value={form.time} onChange={(v) => setForm((p) => ({ ...p, time: v }))} placeholder="e.g. 7:30 AM" />
          <Field label="Driver Name" value={form.driver} onChange={(v) => setForm((p) => ({ ...p, driver: v }))} placeholder="e.g. Ramesh Kumar" />
          <Field label="Driver Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
          <Field label="Capacity" value={form.capacity || ""} onChange={(v) => setForm((p) => ({ ...p, capacity: Number(v) || 0 }))} type="number" placeholder="e.g. 40" />
          <Field label="Students Enrolled" value={form.students || ""} onChange={(v) => setForm((p) => ({ ...p, students: Number(v) || 0 }))} type="number" placeholder="e.g. 35" />
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Stops (comma-separated)</label>
            <Input
              value={stopsRaw}
              onChange={(e) => setStopsRaw(e.target.value)}
              placeholder="e.g. Pandua, Kalna, Hooghly"
              className="h-8 text-[13px] bg-white border-slate-200"
            />
          </div>
        </div>
        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Add Route"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══ Driver Dialog ══════════════════════════════════════════════════════════════

const BLANK_DRIVER: Omit<TransportDriver, "id"> = {
  name: "", phone: "", license: "", assigned_bus: "", assigned_route: "", status: "Active",
};

function DriverDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportDriver | null;
  onSaved: (d: TransportDriver) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK_DRIVER });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, phone: initial.phone, license: initial.license, assigned_bus: initial.assigned_bus, assigned_route: initial.assigned_route, status: initial.status }
        : { ...BLANK_DRIVER });
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
          <Field label="Assigned Bus" value={form.assigned_bus} onChange={(v) => setForm((p) => ({ ...p, assigned_bus: v }))} placeholder="e.g. WB 12 AB 1234" />
          <Field label="Assigned Route" value={form.assigned_route} onChange={(v) => setForm((p) => ({ ...p, assigned_route: v }))} placeholder="e.g. Pandua Express" />
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

// ══ Vehicle Dialog ═════════════════════════════════════════════════════════════

const BLANK_VEHICLE: Omit<TransportVehicle, "id"> = {
  bus_number: "", model: "", type: "Bus", capacity: 0, driver: "", assigned_route: "", status: "Active", last_service: "",
};

function VehicleDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: TransportVehicle | null;
  onSaved: (v: TransportVehicle) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ ...BLANK_VEHICLE });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { bus_number: initial.bus_number, model: initial.model, type: initial.type, capacity: initial.capacity, driver: initial.driver, assigned_route: initial.assigned_route, status: initial.status, last_service: initial.last_service }
        : { ...BLANK_VEHICLE });
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
          <Field label="Assigned Driver" value={form.driver} onChange={(v) => setForm((p) => ({ ...p, driver: v }))} placeholder="e.g. Ramesh Kumar" />
          <Field label="Assigned Route" value={form.assigned_route} onChange={(v) => setForm((p) => ({ ...p, assigned_route: v }))} placeholder="e.g. Pandua Express" />
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

// ══ Page ═══════════════════════════════════════════════════════════════════════

export default function TransportPage() {
  const [tab, setTab] = useState("routes");
  const [loading, setLoading] = useState(true);

  // Routes
  const [routes, setRoutes]           = useState<TransportRoute[]>([]);
  const [routeDialog, setRouteDialog] = useState(false);
  const [editRoute, setEditRoute]     = useState<TransportRoute | null>(null);

  // Students
  const [studentTransport, setStudentTransport] = useState<TransportStudent[]>([]);

  // Drivers
  const [drivers, setDrivers]               = useState<TransportDriver[]>([]);
  const [driversLoaded, setDriversLoaded]   = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverDialog, setDriverDialog]     = useState(false);
  const [editDriver, setEditDriver]         = useState<TransportDriver | null>(null);

  // Vehicles
  const [vehicles, setVehicles]               = useState<TransportVehicle[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded]   = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleDialog, setVehicleDialog]     = useState(false);
  const [editVehicle, setEditVehicle]         = useState<TransportVehicle | null>(null);

  // Load dashboard on mount
  useEffect(() => {
    setLoading(true);
    transportApi.dashboard()
      .then((res) => { setRoutes(res.routes); setStudentTransport(res.students); })
      .catch(() => { setRoutes([]); setStudentTransport([]); })
      .finally(() => setLoading(false));
  }, []);

  const loadDrivers = () => {
    if (driversLoaded) return;
    setDriversLoading(true);
    transportApi.listDrivers()
      .then((d) => { setDrivers(d); setDriversLoaded(true); })
      .catch(() => setDrivers([]))
      .finally(() => setDriversLoading(false));
  };

  const loadVehicles = () => {
    if (vehiclesLoaded) return;
    setVehiclesLoading(true);
    transportApi.listVehicles()
      .then((v) => { setVehicles(v); setVehiclesLoaded(true); })
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  };

  const totalStudents = useMemo(() => routes.reduce((a, r) => a + r.students, 0), [routes]);
  const totalCapacity = useMemo(() => routes.reduce((a, r) => a + r.capacity, 0), [routes]);
  const utilization = totalCapacity > 0 ? `${Math.round((totalStudents / totalCapacity) * 100)}%` : "0%";

  const handleRouteDelete = async (r: TransportRoute) => {
    if (!confirm(`Delete route "${r.name}"?`)) return;
    await transportApi.deleteRoute(r.id);
    setRoutes((prev) => prev.filter((x) => x.id !== r.id));
  };

  const handleDriverDelete = async (d: TransportDriver) => {
    if (!confirm(`Delete driver "${d.name}"?`)) return;
    await transportApi.deleteDriver(d.id);
    setDrivers((prev) => prev.filter((x) => x.id !== d.id));
  };

  const handleVehicleDelete = async (v: TransportVehicle) => {
    if (!confirm(`Delete vehicle "${v.bus_number}"?`)) return;
    await transportApi.deleteVehicle(v.id);
    setVehicles((prev) => prev.filter((x) => x.id !== v.id));
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Routes",             value: routes.length },
            { label: "Students Using Transport", value: totalStudents },
            { label: "Total Capacity",           value: totalCapacity },
            { label: "Utilisation",              value: utilization },
          ].map((st) => (
            <Card key={st.label} className="shadow-none border-slate-200">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => {
          setTab(v);
          if (v === "drivers")  loadDrivers();
          if (v === "vehicles") loadVehicles();
        }}>
          <TabsList className="bg-slate-100 h-8">
            <TabsTrigger value="routes"   className="text-[12px] h-6">Routes</TabsTrigger>
            <TabsTrigger value="students" className="text-[12px] h-6">Students</TabsTrigger>
            <TabsTrigger value="drivers"  className="text-[12px] h-6">
              <FontAwesomeIcon icon={faIdCard} className="mr-1.5 text-[11px]" />Drivers
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="text-[12px] h-6">
              <FontAwesomeIcon icon={faCar} className="mr-1.5 text-[11px]" />Vehicles
            </TabsTrigger>
          </TabsList>

          {/* ── Routes ── */}
          <TabsContent value="routes" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Transport Routes</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Manage bus routes and their stops.</p>
              </div>
              <Button
                size="sm"
                className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
                onClick={() => { setEditRoute(null); setRouteDialog(true); }}
              >
                <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Route
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`route-skel-${i}`} className="shadow-none border-slate-200">
                    <CardHeader className="pb-2"><Skeleton className="h-10 w-full" /></CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : routes.length === 0 ? (
              <Card className="shadow-none border-slate-200">
                <CardContent className="p-10 text-center text-[13px] text-slate-500">No transport routes found</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {routes.map((r) => {
                  const utilPct = r.capacity > 0 ? Math.round((r.students / r.capacity) * 100) : 0;
                  return (
                    <Card key={r.id} className="shadow-none border-slate-200 hover:border-[#007BFF]/40 hover:shadow-sm transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#007BFF]/10 flex items-center justify-center shrink-0">
                              <FontAwesomeIcon icon={faBus} className="text-[#007BFF] text-[13px]" />
                            </div>
                            <div>
                              <CardTitle className="text-[14px]">{r.name}</CardTitle>
                              <CardDescription className="text-[11px]">{r.bus} · {r.time}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-right mr-2">
                              <p className="text-[13px] font-semibold text-slate-700">{r.students}/{r.capacity}</p>
                              <p className="text-[10px] text-slate-400">{utilPct}% full</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                              onClick={() => { setEditRoute(r); setRouteDialog(true); }}>
                              <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRouteDelete(r)}>
                              <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {r.stops.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-600">
                              <FontAwesomeIcon icon={faLocationDot} className="text-[9px] text-slate-400" />
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-[12px] text-slate-500">
                          Driver: <span className="font-medium text-slate-700">{r.driver}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          {r.phone}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Students ── */}
          <TabsContent value="students" className="mt-4">
            <Card className="shadow-none border-slate-200">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold">Students Using Transport</CardTitle>
                  <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5">
                    <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                {loading ? (
                  <div className="px-6 pb-6 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={`student-skel-${i}`} className="h-10 w-full" />
                    ))}
                  </div>
                ) : studentTransport.length === 0 ? (
                  <div className="p-6 text-[12px] text-slate-500">No students assigned to transport</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        {["Student", "Class", "Route", "Pickup Stop", "Status"].map((h) => (
                          <TableHead key={h} className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Student" ? "pl-6" : ""} ${h === "Status" ? "pr-6" : ""}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentTransport.map((s) => (
                        <TableRow key={s.id} className="hover:bg-slate-50 border-slate-100">
                          <TableCell className="text-[13px] font-medium text-slate-900 pl-6">{s.name}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{s.class_name}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{s.route}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{s.pickup}</TableCell>
                          <TableCell className="pr-6"><StatusBadge status={s.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Drivers ── */}
          <TabsContent value="drivers" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Drivers</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Manage bus drivers and their assignments.</p>
              </div>
              <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
                onClick={() => { setEditDriver(null); setDriverDialog(true); }}>
                <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Driver
              </Button>
            </div>
            <Card className="shadow-none border-slate-200">
              <CardContent className="p-0">
                {driversLoading ? (
                  <div className="divide-y divide-slate-100">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-52" /></div>
                        <Skeleton className="h-5 w-16 rounded" />
                      </div>
                    ))}
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <FontAwesomeIcon icon={faIdCard} className="text-2xl" />
                    <p className="text-[13px]">No drivers found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        {["Name", "Phone", "License", "Assigned Bus", "Route", "Status", ""].map((h) => (
                          <TableHead key={h} className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Name" ? "pl-6" : ""}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((d) => (
                        <TableRow key={d.id} className="hover:bg-slate-50 border-slate-100">
                          <TableCell className="text-[13px] font-medium text-slate-900 pl-6">{d.name}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{d.phone}</TableCell>
                          <TableCell className="text-[12px] text-slate-500 font-mono">{d.license}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{d.assigned_bus || "—"}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{d.assigned_route || "—"}</TableCell>
                          <TableCell><StatusBadge status={d.status} /></TableCell>
                          <TableCell className="pr-4">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                                onClick={() => { setEditDriver(d); setDriverDialog(true); }}>
                                <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleDriverDelete(d)}>
                                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Vehicles ── */}
          <TabsContent value="vehicles" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Vehicles</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Manage the fleet of school vehicles.</p>
              </div>
              <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
                onClick={() => { setEditVehicle(null); setVehicleDialog(true); }}>
                <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Vehicle
              </Button>
            </div>
            <Card className="shadow-none border-slate-200">
              <CardContent className="p-0">
                {vehiclesLoading ? (
                  <div className="divide-y divide-slate-100">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-52" /></div>
                        <Skeleton className="h-5 w-16 rounded" />
                      </div>
                    ))}
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <FontAwesomeIcon icon={faCar} className="text-2xl" />
                    <p className="text-[13px]">No vehicles found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        {["Bus No.", "Model", "Type", "Capacity", "Driver", "Route", "Last Service", "Status", ""].map((h) => (
                          <TableHead key={h} className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Bus No." ? "pl-6" : ""}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((v) => (
                        <TableRow key={v.id} className="hover:bg-slate-50 border-slate-100">
                          <TableCell className="text-[13px] font-medium text-slate-900 pl-6">{v.bus_number}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{v.model || "—"}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{v.type}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{v.capacity}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{v.driver || "—"}</TableCell>
                          <TableCell className="text-[13px] text-slate-600">{v.assigned_route || "—"}</TableCell>
                          <TableCell className="text-[13px] text-slate-500">{v.last_service || "—"}</TableCell>
                          <TableCell><StatusBadge status={v.status} /></TableCell>
                          <TableCell className="pr-4">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                                onClick={() => { setEditVehicle(v); setVehicleDialog(true); }}>
                                <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleVehicleDelete(v)}>
                                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RouteDialog
        open={routeDialog}
        onClose={() => setRouteDialog(false)}
        initial={editRoute}
        onSaved={(r) => setRoutes((prev) => {
          const idx = prev.findIndex((x) => x.id === r.id);
          return idx >= 0 ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev];
        })}
      />
      <DriverDialog
        open={driverDialog}
        onClose={() => setDriverDialog(false)}
        initial={editDriver}
        onSaved={(d) => setDrivers((prev) => {
          const idx = prev.findIndex((x) => x.id === d.id);
          return idx >= 0 ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev];
        })}
      />
      <VehicleDialog
        open={vehicleDialog}
        onClose={() => setVehicleDialog(false)}
        initial={editVehicle}
        onSaved={(v) => setVehicles((prev) => {
          const idx = prev.findIndex((x) => x.id === v.id);
          return idx >= 0 ? prev.map((x) => (x.id === v.id ? v : x)) : [v, ...prev];
        })}
      />
    </>
  );
}