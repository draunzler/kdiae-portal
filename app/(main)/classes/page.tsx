"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faChalkboardTeacher, faUsers, faBookOpen,
  faGraduationCap, faPencil, faTrash, faSpinner,
  faXmark, faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { classesApi, subjectsApi, type Class, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/classes/StatCard";
import { StatusBadge } from "@/components/classes/StatusBadge";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassDialog } from "@/components/classes/ClassDialog";
import { SubjectDialog } from "@/components/classes/SubjectDialog";


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