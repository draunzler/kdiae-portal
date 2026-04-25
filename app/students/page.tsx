"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faPlus, faEye, faPenToSquare, faTrash, faXmark, faUser,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ── Data ─────────────────────────────────────────────────────────────────────

const STUDENTS = [
  { id: "S001", name: "Priya Chatterjee",  class: "Class 5", section: "A", gender: "Female", fee: "Paid",    attendance: 94, guardian: "Sanjoy Chatterjee",  phone: "98300-11111" },
  { id: "S002", name: "Arjun Mukherjee",   class: "Class 6", section: "B", gender: "Male",   fee: "Paid",    attendance: 88, guardian: "Tapan Mukherjee",    phone: "98300-22222" },
  { id: "S003", name: "Sneha Banerjee",    class: "Class 4", section: "A", gender: "Female", fee: "Partial", attendance: 72, guardian: "Rupa Banerjee",      phone: "98300-33333" },
  { id: "S004", name: "Rohan Das",         class: "Class 3", section: "C", gender: "Male",   fee: "Unpaid",  attendance: 65, guardian: "Amit Das",           phone: "98300-44444" },
  { id: "S005", name: "Tanya Roy",         class: "Class 5", section: "B", gender: "Female", fee: "Paid",    attendance: 91, guardian: "Subhash Roy",        phone: "98300-55555" },
  { id: "S006", name: "Akash Ghosh",       class: "Class 2", section: "A", gender: "Male",   fee: "Paid",    attendance: 85, guardian: "Pranab Ghosh",       phone: "98300-66666" },
  { id: "S007", name: "Ritika Sengupta",   class: "Class 6", section: "A", gender: "Female", fee: "Partial", attendance: 67, guardian: "Mohan Sengupta",     phone: "98300-77777" },
  { id: "S008", name: "Nikhil Bose",       class: "Class 1", section: "B", gender: "Male",   fee: "Paid",    attendance: 96, guardian: "Dipak Bose",         phone: "98300-88888" },
  { id: "S009", name: "Ananya Pal",        class: "Class 4", section: "C", gender: "Female", fee: "Unpaid",  attendance: 79, guardian: "Suresh Pal",         phone: "98300-99999" },
  { id: "S010", name: "Raj Chakraborty",   class: "Class 3", section: "A", gender: "Male",   fee: "Paid",    attendance: 90, guardian: "Manoj Chakraborty",  phone: "98301-00000" },
];

const feeVariant: Record<string, string> = {
  Paid:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Unpaid:  "bg-red-50 text-red-700 border-red-200",
  Partial: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterFee, setFilterFee] = useState("All");
  const [selected, setSelected] = useState<typeof STUDENTS[0] | null>(null);

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "All" || s.class === filterClass;
    const matchFee   = filterFee   === "All" || s.fee   === filterFee;
    return matchSearch && matchClass && matchFee;
  });

  const classes = Array.from(new Set(STUDENTS.map((s) => s.class)));

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">

      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar title="Students" description="Manage all enrolled students" />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Students",        value: STUDENTS.length },
                { label: "Fee Paid",               value: STUDENTS.filter((s) => s.fee === "Paid").length },
                { label: "Partial / Unpaid",       value: STUDENTS.filter((s) => s.fee !== "Paid").length },
                { label: "Below 75% Attendance",   value: STUDENTS.filter((s) => s.attendance < 75).length },
              ].map((st) => (
                <Card key={st.label} className="shadow-none border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-slate-900">{st.value}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{st.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table card */}
            <Card className="shadow-none border-slate-200">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold">All Students</CardTitle>
                  <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-8 gap-2">
                    <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Student
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="relative flex-1 max-w-[260px]">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
                    <Input
                      placeholder="Search by name or ID…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 bg-slate-50 border-slate-200 text-[13px] h-8"
                    />
                  </div>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-[13px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Classes</SelectItem>
                      {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterFee} onValueChange={setFilterFee}>
                    <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200 text-[13px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Fee Status</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500 pl-6">ID</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Name</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Class</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Gender</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Fee Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Attendance</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Guardian</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500 pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50 border-slate-100">
                        <TableCell className="text-[12px] text-slate-400 font-mono pl-6">{s.id}</TableCell>
                        <TableCell className="text-[13px] font-medium text-slate-900">{s.name}</TableCell>
                        <TableCell className="text-[13px] text-slate-600">{s.class} – {s.section}</TableCell>
                        <TableCell className="text-[13px] text-slate-600">{s.gender}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${feeVariant[s.fee]}`}>
                            {s.fee}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={s.attendance} className="h-1.5 w-16" />
                            <span className={`text-[12px] font-medium ${s.attendance < 75 ? "text-red-600" : "text-slate-700"}`}>
                              {s.attendance}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-600">{s.guardian}</TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF]" onClick={() => setSelected(s)}>
                              <FontAwesomeIcon icon={faEye} className="text-[12px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF]">
                              <FontAwesomeIcon icon={faPenToSquare} className="text-[12px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600">
                              <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Student detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          onClick={() => setSelected(null)}
        >
          <Card className="w-[420px] shadow-xl border-slate-200" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#007BFF] flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-white text-[14px]" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px]">{selected.name}</CardTitle>
                    <p className="text-[12px] text-slate-500">{selected.id}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
                  <FontAwesomeIcon icon={faXmark} className="text-[13px]" />
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              {[
                ["Class",        `${selected.class} – ${selected.section}`],
                ["Gender",       selected.gender],
                ["Fee Status",   selected.fee],
                ["Attendance",   `${selected.attendance}%`],
                ["Guardian",     selected.guardian],
                ["Phone",        selected.phone],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">{label}</p>
                  <p className="text-[13px] text-slate-800 mt-0.5">{val}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
