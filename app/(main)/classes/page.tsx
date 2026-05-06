"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faChalkboardTeacher, faUsers, faBookOpen,
  faGraduationCap, faCheck, faPencil, faTrash, faSpinner,
  faXmark, faHourglass, faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { classesApi, subjectsApi, type Class, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_SECTIONS = ["A", "B", "C", "D", "E"];

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

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return null;
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <FontAwesomeIcon icon={faHourglass} className="text-[8px]" /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200">
      <FontAwesomeIcon icon={faXmark} className="text-[8px]" /> Rejected
    </span>
  );
}

function ClassCard({ cls, onEdit, onDelete, onApprove, onReject, isAdmin }: {
  cls: Class; onEdit: (c: Class) => void; onDelete: (id: string) => void;
  onApprove: (id: string) => void; onReject: (id: string) => void; isAdmin: boolean;
}) {
  const isPending = cls.status === "pending";
  return (
    <Card className={`shadow-none border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150 ${isPending ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <CardContent className="p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex flex-col justify-center md:px-5 md:py-4 md:min-w-[170px] md:border-r md:border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-bold text-slate-900">{cls.name}</p>
              <StatusBadge status={cls.status} />
            </div>
            {cls.class_code && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cls.class_code}</p>}
            {isPending && cls.submitted_by && <p className="text-[10px] text-slate-400 mt-0.5">by {cls.submitted_by}</p>}
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
                  <span key={s} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-[#007BFF]/10 text-[#007BFF]">{s}</span>
                ))}
                <span className="text-[11px] text-slate-400 ml-1">{cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase w-14 shrink-0 mt-0.5">Subjects</span>
              <div className="flex flex-wrap gap-1">
                {cls.subjects.map((sub) => (
                  <span key={sub} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">{sub}</span>
                ))}
                {cls.subjects.length === 0 && <span className="text-[11px] text-slate-400 italic">None assigned</span>}
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center md:px-5 md:py-4 md:border-l md:border-slate-100 gap-3 shrink-0 mt-3 pt-3 border-t border-slate-100 md:mt-0 md:pt-0 md:border-t-0">
            <div className="text-left md:text-right">
              <p className="text-[18px] font-bold text-slate-900 leading-none">{cls.student_count}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">students</p>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && isPending && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600 hover:bg-green-50" title="Approve" onClick={() => onApprove(cls.id)}>
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Reject" onClick={() => onReject(cls.id)}>
                    <FontAwesomeIcon icon={faXmark} className="text-[11px]" />
                  </Button>
                </>
              )}
              {(isAdmin || !isPending) && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50" onClick={() => onEdit(cls)}>
                  <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => onDelete(cls.id)}>
                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Class Dialog ──────────────────────────────────────────────────────────────

const BLANK_CLASS = { name: "", teacher: "", sections: [] as string[], subjects: [] as string[] };

function ClassDialog({ open, onClose, initial, onSaved }: {
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
    // Reset form
    setForm(initial
      ? { name: initial.name, teacher: initial.teacher, sections: [...initial.sections], subjects: [...initial.subjects] }
      : { ...BLANK_CLASS });
    setError("");

    // Fetch available subjects — cancel if dialog closes or re-opens before completion
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

// ── Subject Dialog ────────────────────────────────────────────────────────────

const BLANK_SUB = { name: "", code: "", description: "" };

function SubjectDialog({ open, onClose, initial, onSaved }: {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classes, setClasses]         = useState<Class[]>([]);;
  const [subjects, setSubjects]       = useState<Subject[]>([]);
  const [stats, setStats]             = useState({ total_classes: 0, total_sections: 0, total_students: 0, total_subjects: 0 });
  const [loading, setLoading]         = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [classTarget, setClassTarget]         = useState<Class | null>(null);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [subjectTarget, setSubjectTarget]         = useState<Subject | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [list, s, subs] = await Promise.all([classesApi.list(), classesApi.stats(), subjectsApi.list()]);
      setClasses(list);
      setStats(s);
      setSubjects(subs);
    } finally { setLoading(false); }
  };

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try { setSubjects(await subjectsApi.list()); } finally { setSubjectsLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    await classesApi.delete(id);
    setClasses((p) => p.filter((c) => c.id !== id));
    setStats((p) => ({ ...p, total_classes: p.total_classes - 1 }));
  };

  const handleApproveClass = async (id: string) => {
    const updated = await classesApi.approve(id);
    setClasses((p) => p.map((c) => c.id === id ? updated : c));
    setStats((p) => ({ ...p, total_classes: p.total_classes }));
  };

  const handleRejectClass = async (id: string) => {
    const updated = await classesApi.reject(id);
    setClasses((p) => p.map((c) => c.id === id ? updated : c));
  };

  const handleApproveSubject = async (id: string) => {
    const updated = await subjectsApi.approve(id);
    setSubjects((p) => p.map((s) => s.id === id ? updated : s));
    setStats((p) => ({ ...p, total_subjects: p.total_subjects }));
  };

  const handleRejectSubject = async (id: string) => {
    const updated = await subjectsApi.reject(id);
    setSubjects((p) => p.map((s) => s.id === id ? updated : s));
  };

  const handleClassSaved = (saved: Class) => {
    setClasses((p) => { const i = p.findIndex((c) => c.id === saved.id); return i >= 0 ? p.map((c) => c.id === saved.id ? saved : c) : [saved, ...p]; });
    setStats((p) => ({ ...p, total_classes: classes.length + (classes.some((c) => c.id === saved.id) ? 0 : 1) }));
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (!confirm(`Delete subject "${sub.name}"? This cannot be undone.`)) return;
    await subjectsApi.delete(sub.id);
    setSubjects((p) => p.filter((s) => s.id !== sub.id));
    setStats((p) => ({ ...p, total_subjects: p.total_subjects - 1 }));
  };

  const handleSubjectSaved = (saved: Subject) => {
    setSubjects((p) => { const i = p.findIndex((s) => s.id === saved.id); return i >= 0 ? p.map((s) => s.id === saved.id ? saved : s) : [saved, ...p]; });
    if (!subjects.some((s) => s.id === saved.id)) setStats((p) => ({ ...p, total_subjects: p.total_subjects + 1 }));
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={faGraduationCap}     label="Total Classes"    value={stats.total_classes} />
          <StatCard icon={faUsers}             label="Total Sections"   value={stats.total_sections} />
          <StatCard icon={faChalkboardTeacher} label="Total Students"   value={stats.total_students} />
          <StatCard icon={faBookOpen}          label="Total Subjects"   value={stats.total_subjects} />
        </div>

        <Tabs defaultValue="classes">
          <TabsList className="bg-slate-100 h-8 p-0.5">
            <TabsTrigger value="classes" className="text-[12px] h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Classes</TabsTrigger>
            <TabsTrigger value="subjects" className="text-[12px] h-7 data-[state=active]:bg-white data-[state=active]:shadow-none">Subjects</TabsTrigger>
          </TabsList>

          {/* ── Classes tab ── */}
          <TabsContent value="classes" className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-[14px] font-semibold text-slate-800">All Classes</h2>
              <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-9 sm:h-8 gap-1.5 w-full sm:w-auto"
                onClick={() => { setClassTarget(null); setShowClassDialog(true); }}>
                <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Class
              </Button>
            </div>

            <div className="hidden md:flex items-center px-5 gap-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide -mb-1">
              <span className="min-w-[170px]">Class / Teacher</span>
              <span className="flex-1">Sections & Subjects</span>
              <span className="w-24 text-right pr-1">Students</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-white px-5 py-4 flex items-center gap-4">
                    <div className="flex flex-col gap-2 min-w-[160px]"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
                    <div className="flex-1 flex gap-2"><Skeleton className="h-6 w-16 rounded" /><Skeleton className="h-6 w-20 rounded" /></div>
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
                  <ClassCard key={cls.id} cls={cls}
                    isAdmin={isAdmin}
                    onEdit={(c) => { setClassTarget(c); setShowClassDialog(true); }}
                    onDelete={handleDeleteClass}
                    onApprove={handleApproveClass}
                    onReject={handleRejectClass} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Subjects tab ── */}
          <TabsContent value="subjects" className="mt-4 flex flex-col gap-3" onAnimationStart={() => subjects.length === 0 && !loading && loadSubjects()}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-[14px] font-semibold text-slate-800">All Subjects</h2>
              <Button size="sm" className="bg-[#007BFF] hover:bg-[#0069d9] text-white text-[13px] h-9 sm:h-8 gap-1.5 w-full sm:w-auto"
                onClick={() => { setSubjectTarget(null); setShowSubjectDialog(true); }}>
                <FontAwesomeIcon icon={faPlus} className="text-[11px]" /> Add Subject
              </Button>
            </div>

            <Card className="shadow-none border-slate-200 py-0">
              <CardContent className="p-0">
                {subjectsLoading ? (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3">
                        <Skeleton className="h-7 w-14 rounded" />
                        <div className="flex-1 flex flex-col gap-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-48" /></div>
                      </div>
                    ))}
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <FontAwesomeIcon icon={faBookOpen} className="text-2xl" />
                    <p className="text-[13px]">No subjects yet. Add your first subject above.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subjects.map((sub) => (
                      <div key={sub.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors ${sub.status === "pending" ? "bg-amber-50/40" : sub.status === "rejected" ? "bg-red-50/30" : ""}`}>
                        <div className="flex flex-col items-center gap-0.5 shrink-0 w-16">
                          <span className="text-[10px] font-mono font-semibold text-[#007BFF] bg-[#007BFF]/10 px-1.5 py-0.5 rounded">{sub.subject_uid}</span>
                          {sub.code && <span className="text-[10px] font-mono text-slate-400">{sub.code}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-semibold text-slate-800">{sub.name}</p>
                            <StatusBadge status={sub.status} />
                          </div>
                          {sub.description && <p className="text-[11px] text-slate-400 truncate mt-0.5">{sub.description}</p>}
                          {sub.status === "pending" && sub.submitted_by && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Submitted by {sub.submitted_by}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdmin && sub.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600 hover:bg-green-50" title="Approve"
                                onClick={() => handleApproveSubject(sub.id)}>
                                <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Reject"
                                onClick={() => handleRejectSubject(sub.id)}>
                                <FontAwesomeIcon icon={faXmark} className="text-[11px]" />
                              </Button>
                            </>
                          )}
                          {(isAdmin || sub.status === "pending") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#007BFF] hover:bg-blue-50"
                              onClick={() => { setSubjectTarget(sub); setShowSubjectDialog(true); }}>
                              <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteSubject(sub)}>
                            <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ClassDialog
        open={showClassDialog}
        onClose={() => setShowClassDialog(false)}
        initial={classTarget}
        onSaved={handleClassSaved}
      />
      <SubjectDialog
        open={showSubjectDialog}
        onClose={() => setShowSubjectDialog(false)}
        initial={subjectTarget}
        onSaved={handleSubjectSaved}
      />
    </>
  );
}