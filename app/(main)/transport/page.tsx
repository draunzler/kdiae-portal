"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBus, faIdCard, faCar, faUser } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  transportApi,
  type TransportStudent,
  type TransportDriver,
  type TransportVehicle,
} from "@/lib/api";
import { StudentDialog } from "@/components/transport/StudentDialog";
import { DriverDialog } from "@/components/transport/DriverDialog";
import { VehicleDialog } from "@/components/transport/VehicleDialog";
import { StudentsTab } from "@/components/transport/StudentsTab";
import { DriversTab } from "@/components/transport/DriversTab";
import { VehiclesTab } from "@/components/transport/VehiclesTab";

// ══ Page ═══════════════════════════════════════════════════════════════════════

export default function TransportPage() {
  const [tab, setTab] = useState("students");
  const [loading, setLoading] = useState(true);

  // Students
  const [studentTransport, setStudentTransport] = useState<TransportStudent[]>([]);
  const [studentDialog, setStudentDialog]       = useState(false);
  const [editStudent, setEditStudent]           = useState<TransportStudent | null>(null);

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

  // Load students on mount
  useEffect(() => {
    setLoading(true);
    transportApi.listStudents()
      .then((s) => setStudentTransport(s))
      .catch(() => setStudentTransport([]))
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

  const handleStudentDelete = async (s: TransportStudent) => {
    if (!confirm(`Remove "${s.name}" from transport?`)) return;
    await transportApi.deleteStudent(s.id);
    setStudentTransport((prev) => prev.filter((x) => x.id !== s.id));
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
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Students Using Transport", value: studentTransport.length, icon: faUser },
            { label: "Drivers",                  value: drivers.length,           icon: faIdCard },
            { label: "Vehicles",                 value: vehicles.length,          icon: faBus },
          ].map((st) => (
            <Card key={st.label} className="shadow-none border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#007BFF]/10 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={st.icon} className="text-[#007BFF] text-[14px]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
                </div>
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
            <TabsTrigger value="students" className="text-[12px] h-6">
              <FontAwesomeIcon icon={faUser} className="mr-1.5 text-[11px]" />Students
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="text-[12px] h-6">
              <FontAwesomeIcon icon={faCar} className="mr-1.5 text-[11px]" />Vehicles
            </TabsTrigger>
            <TabsTrigger value="drivers"  className="text-[12px] h-6">
              <FontAwesomeIcon icon={faIdCard} className="mr-1.5 text-[11px]" />Drivers
            </TabsTrigger>
          </TabsList>

          {/* ── Students ── */}
          <TabsContent value="students" className="mt-4">
            <StudentsTab
              students={studentTransport}
              loading={loading}
              onAdd={() => { setEditStudent(null); setStudentDialog(true); }}
              onEdit={(s) => { setEditStudent(s); setStudentDialog(true); }}
              onDelete={handleStudentDelete}
            />
          </TabsContent>

          {/* ── Vehicles ── */}
          <TabsContent value="vehicles" className="mt-4">
            <VehiclesTab
              vehicles={vehicles}
              loading={vehiclesLoading}
              onAdd={() => { setEditVehicle(null); setVehicleDialog(true); }}
              onEdit={(v) => { setEditVehicle(v); setVehicleDialog(true); }}
              onDelete={handleVehicleDelete}
            />
          </TabsContent>

          {/* ── Drivers ── */}
          <TabsContent value="drivers" className="mt-4">
            <DriversTab
              drivers={drivers}
              loading={driversLoading}
              onAdd={() => { setEditDriver(null); setDriverDialog(true); }}
              onEdit={(d) => { setEditDriver(d); setDriverDialog(true); }}
              onDelete={handleDriverDelete}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <StudentDialog
        open={studentDialog}
        onClose={() => setStudentDialog(false)}
        initial={editStudent}
        onSaved={(s) => setStudentTransport((prev) => {
          const idx = prev.findIndex((x) => x.id === s.id);
          return idx >= 0 ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev];
        })}
      />
      <DriverDialog
        open={driverDialog}
        onClose={() => setDriverDialog(false)}
        initial={editDriver}
        vehicles={vehicles}
        onSaved={(d) => setDrivers((prev) => {
          const idx = prev.findIndex((x) => x.id === d.id);
          return idx >= 0 ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev];
        })}
      />
      <VehicleDialog
        open={vehicleDialog}
        onClose={() => setVehicleDialog(false)}
        initial={editVehicle}
        drivers={drivers}
        onSaved={(v) => setVehicles((prev) => {
          const idx = prev.findIndex((x) => x.id === v.id);
          return idx >= 0 ? prev.map((x) => (x.id === v.id ? v : x)) : [v, ...prev];
        })}
      />
    </>
  );
}