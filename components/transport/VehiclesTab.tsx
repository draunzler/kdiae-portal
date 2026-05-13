"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash, faCar } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { type TransportVehicle } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

interface Props {
  vehicles: TransportVehicle[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (v: TransportVehicle) => void;
  onDelete: (v: TransportVehicle) => void;
}

export function VehiclesTab({ vehicles, loading, onAdd, onEdit, onDelete }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">Vehicles</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">Manage the fleet of school vehicles.</p>
        </div>
        <Button
          size="sm"
          className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-1.5"
          onClick={onAdd}
        >
          <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Vehicle
        </Button>
      </div>
      <Card className="shadow-none border-slate-200 py-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-52" />
                  </div>
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
                  {["Bus No.", "Model", "Type", "Capacity", "Driver", "Last Service", "Status", ""].map((h) => (
                    <TableHead
                      key={h}
                      className={`text-[11px] font-semibold uppercase text-slate-500 ${h === "Bus No." ? "pl-6" : ""}`}
                    >
                      {h}
                    </TableHead>
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
                    <TableCell className="text-[13px] text-slate-500">{v.last_service || "—"}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                          onClick={() => onEdit(v)}
                        >
                          <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => onDelete(v)}
                        >
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
    </>
  );
}
