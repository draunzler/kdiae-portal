"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faChalkboardTeacher, faUsers, faBookOpen,
  faGraduationCap, faCheck, faPencil, faTrash, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { classesApi, type Class } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  English:  "bg-blue-50   text-blue-700   border-blue-200",
  Bengali:  "bg-orange-50 text-orange-700 border-orange-200",
  Math:     "bg-violet-50 text-violet-700 border-violet-200",
  EVS:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Science:  "bg-cyan-50   text-cyan-700   border-cyan-200",
  Social:   "bg-amber-50  text-amber-700  border-amber-200",
  Drawing:  "bg-pink-50   text-pink-700   border-pink-200",
  Sanskrit: "bg-red-50    text-red-700    border-red-200",
  Computer: "bg-slate-100 text-slate-700  border-slate-200",
};

const ALL_SUBJECTS = ["English","Bengali","Math","EVS","Science","Social","Drawing","Sanskrit","Computer","Hindi","History","Geography","Physics","Chemistry","Biology"];
const ALL_SECTIONS = ["A","B","C","D","E"];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: typeof faUsers; label: string; value: number | string }) {
  return (
    <Card className="shadow-none border-slate-200">
      <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#007BFF]/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={icon} className="text-[14px] text-[#007BFF]" />
        </div>
        <div>
          <p className="text-lg md:text-xl font-bold text-slate-900 leading-none">{value}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Class card ────────────────────────────────────────────────────────────────

function ClassCard({
  cls, onEdit, onDelete,
}: {
  cls: Class;
  onEdit: (cls: Class) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="shadow-none border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <CardContent className="p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex flex-col justify-center md:px-5 md:py-4 md:min-w-[160px] md:border-r md:border-slate-100">
            <p className="text-[15px] font-bold text-slate-900">{cls.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-[10px]" />
              {cls.teacher || "—"}
            </p>
          </div>

          <div className="md:flex-1 md:px-5 md:py-4 flex flex-col justify-center gap-2.5 mt-3 md:mt-0">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase w-14 shrink-0 mt-0.5">Sections</span>
              <div className="flex gap-1 flex-wrap items-center">
                {cls.sections.map((s) => (
                  <span key={s} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-[#007BFF]/10 text-[#007BFF]">
                    {s}
                  </span>
                ))}
                <span className="text-[11px] text-slate-400 ml-1">
                  {cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase w-14 shrink-0 mt-0.5">Subjects</span>
              <div className="flex flex-wrap gap-1">
                {cls.subjects.map((sub) => (
                  <span key={sub}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${SUBJECT_COLORS[sub] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center md:px-5 md:py-4 md:border-l md:border-slate-100 gap-3 shrink-0 mt-3 pt-3 border-t border-slate-100 md:mt-0 md:pt-0 md:border-t-0">
            <div className="text-left md:text-right">
              <p className="text-[18px] font-bold text-slate-900 leading-none">{cls.student_count}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">students</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                onClick={() => onEdit(cls)}>
                <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                onClick={() => onDelete(cls.id)}>
                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Class Dialog (add / edit) ─────────────────────────────────────────────────

const BLANK = { name: "", teacher: "", sections: [] as string[], subjects: [] as string[] };

function ClassDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Class | null;
  onSaved: (cls: Class) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm]     = useState<typeof BLANK>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (open) {
      const handle = setTimeout(() => {
        setForm(initial
          ? { name: initial.name, teacher: initial.teacher, sections: [...initial.sections], subjects: [...initial.subjects] }
          : { ...BLANK },
        );
        setError("");
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [open, initial]);

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Class name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = isEdit
        ? await classesApi.update(initial!.id, form)
        : await classesApi.create(form);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save class.");
    } finally {
      setSaving(false);
    }
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
                  <button key={s}
                    onClick={() => setForm((p) => ({ ...p, sections: toggle(p.sections, s) }))}
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
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((sub) => {
                const active = form.subjects.includes(sub);
                return (
                  <button key={sub}
                    onClick={() => setForm((p) => ({ ...p, subjects: toggle(p.subjects, sub) }))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-all
                      ${active
                        ? (SUBJECT_COLORS[sub] ?? "bg-slate-100 text-slate-700 border-slate-200")
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                    {active && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 shrink-0 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-3">{error}</p>}
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" className="h-8 text-[13px] bg-[#007BFF] hover:bg-[#0069d9] text-white" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Saving…</>
                : <><FontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-1.5 text-[11px]" />{isEdit ? "Save Changes" : "Create Class"}</>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const [classes, setClasses]       = useState<Class[]>([]);
  const [stats, setStats]           = useState({ total_classes: 0, total_sections: 0, total_students: 0, total_subjects: 0 });
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Class | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([classesApi.list(), classesApi.stats()]);
      setClasses(list);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const openAdd  = () => { setEditTarget(null); setShowDialog(true); };
  const openEdit = (cls: Class) => { setEditTarget(cls); setShowDialog(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    await classesApi.delete(id);
    setClasses((p) => p.filter((c) => c.id !== id));
    setStats((p) => ({ ...p, total_classes: p.total_classes - 1 }));
  };

  const handleSaved = (saved: Class) => {
    setClasses((p) => {
      const idx = p.findIndex((c) => c.id === saved.id);
      return idx >= 0 ? p.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...p];
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={faGraduationCap}     label="Total Classes"    value={stats.total_classes} />
          <StatCard icon={faUsers}             label="Total Sections"   value={stats.total_sections} />
          <StatCard icon={faChalkboardTeacher} label="Total Students"   value={stats.total_students} />
          <StatCard icon={faBookOpen}          label="Subjects Offered" value={stats.total_subjects} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-slate-800">All Classes</h2>
          <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-9 sm:h-8 gap-1.5 w-full sm:w-auto" onClick={openAdd}>
            <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Class
          </Button>
        </div>

        <div className="hidden md:flex items-center px-5 gap-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide -mb-3">
          <span className="min-w-[160px]">Class / Teacher</span>
          <span className="flex-1">Sections & Subjects</span>
          <span className="w-24 text-right pr-1">Students</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white px-5 py-4 flex items-center gap-4">
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex-1 flex gap-2 flex-wrap">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <FontAwesomeIcon icon={faGraduationCap} className="text-3xl mb-1" />
            <p className="text-[13px]">No classes yet. Add your first class above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <ClassDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        initial={editTarget}
        onSaved={handleSaved}
      />
    </>
  );
}