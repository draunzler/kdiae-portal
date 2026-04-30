"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { admissionsApi } from "@/lib/api";
import { LField } from "@/components/form/LField";
import { LDatePicker } from "@/components/form/LDatePicker";
import { LSelect } from "@/components/form/LSelect";
import { FileField } from "@/components/form/FileField";
import { BLOOD_GROUPS, ID_TYPES, RELATIONS, FEE_STATUS, SECTIONS } from "@/components/form/constants";
import { StepperHeader, STEPS } from "./StepperHeader";
import { BLANK_FORM, BLANK_FEES, BLANK_GUARDIAN, EARLY_CLASSES, CLASS_LIST, ACADEMIC_YEARS } from "./constants";

export function AddApplicationWizard({
  open, onClose, onCreated, classesList,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  classesList: string[];
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...BLANK_FORM, fees: { ...BLANK_FEES }, guardian: { ...BLANK_GUARDIAN } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));
  const setG = (f: string, v: string) => setForm((p) => ({ ...p, guardian: { ...p.guardian, [f]: v } }));
  const setFees = (f: string, v: string | number) => setForm((p) => ({ ...p, fees: { ...p.fees, [f]: v } }));

  const isEarly = EARLY_CLASSES.has(form.applying_for_class);
  const allClassOptions = classesList.length > 0 ? classesList : CLASS_LIST;

  const handleClose = () => {
    setStep(0);
    setForm({ ...BLANK_FORM, fees: { ...BLANK_FEES }, guardian: { ...BLANK_GUARDIAN } });
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.applicant_name.trim()) { setError("Applicant name is required."); return; }
    setSaving(true); setError("");
    try {
      await admissionsApi.create(form);
      onCreated();
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit application.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="px-6 pt-6 shrink-0 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-slate-800">New Admission Application</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StepperHeader step={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Step 0 — Personal Information */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <LField label="Full Name of Applicant *" field="applicant_name" value={form.applicant_name} onChange={set} placeholder="As per birth certificate" />
            </div>
            <LDatePicker label="Date of Birth"            field="dob"                value={form.dob}                onChange={set} />
            <LSelect     label="Gender"                   field="gender"             value={form.gender}             options={["Male","Female","Other"]} onChange={set} />
            <LSelect     label="Blood Group"              field="blood_group"        value={form.blood_group}        options={BLOOD_GROUPS} onChange={set} />
            <LSelect     label="Applying for Class"       field="applying_for_class" value={form.applying_for_class} options={allClassOptions} onChange={set} />
            <LSelect     label="Section Preference"       field="section_preference" value={form.section_preference} options={SECTIONS} onChange={set} />
            <LSelect     label="Academic Year"            field="academic_year"      value={form.academic_year}      options={ACADEMIC_YEARS} onChange={set} />
            <LField      label="Parent / Guardian Phone *" field="phone" type="tel"             value={form.phone}              onChange={set} placeholder="98300-XXXXX" />
            <LField      label="Email (optional)"         field="email" type="email"              value={form.email}              onChange={set} />
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Residential Address</label>
              <textarea rows={2} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Full residential address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 1 — Documents */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {isEarly ? (
              <div className="col-span-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-[12px] text-emerald-700">
                <strong>{form.applying_for_class || "This class"}</strong> is an early-childhood class — Transfer &amp; Character Certificates are <em>not required</em>.
              </div>
            ) : (
              <>
                <div className="col-span-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-[12px] text-blue-700">
                  Documents required for <strong>{form.applying_for_class || "this class"}</strong>. Transfer &amp; Character Certificates are mandatory for admission.
                </div>
                <div className="col-span-2">
                  <LField label="Previous School" field="previous_school" value={form.previous_school} onChange={set} placeholder="Name of last attended school" />
                </div>
                <LField label="Transfer Certificate No."  field="tc_number" value={form.tc_number} onChange={set} placeholder="TC/2024/001" />
                <LField label="Character Certificate No." field="cc_number" value={form.cc_number} onChange={set} placeholder="CC/2024/001" />
                <FileField label="Transfer Certificate"  accept=".pdf,image/*" />
                <FileField label="Character Certificate" accept=".pdf,image/*" />
              </>
            )}
            <Separator className="col-span-2" />
            <p className="col-span-2 text-[12px] font-semibold text-slate-500 uppercase">Identity Proof</p>
            <LSelect label="ID Type"   field="student_id_type"   value={form.student_id_type}   options={ID_TYPES} onChange={set} />
            <LField  label="ID Number" field="student_id_number" value={form.student_id_number} onChange={set} />
            <FileField label="Upload ID Proof"         accept=".pdf,image/*" />
            <FileField label="Upload Birth Certificate" accept=".pdf,image/*" />
            {!isEarly && <FileField label="Previous Marksheet" accept=".pdf,image/*" />}
            <FileField label="Student Photo" accept="image/*" />
          </div>
        )}

        {/* Step 2 — Guardian + Fees */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[12px] font-bold text-slate-600 mb-3">Primary Guardian / Parent</p>
              <div className="grid grid-cols-2 gap-3">
                <LField  label="Name"       field="name"       value={form.guardian.name}       onChange={(_, v) => setG("name", v)} />
                <LSelect label="Relation"   field="relation"   value={form.guardian.relation}   options={RELATIONS} onChange={(_, v) => setG("relation", v)} />
                <LField  label="Phone"      field="phone" type="tel"      value={form.guardian.phone}      onChange={(_, v) => setG("phone", v)} />
                <LField  label="Email"      field="email" type="email"      value={form.guardian.email}      onChange={(_, v) => setG("email", v)} />
                <LField  label="Occupation" field="occupation" value={form.guardian.occupation} onChange={(_, v) => setG("occupation", v)} />
                <LSelect label="ID Type"    field="id_type"    value={form.guardian.id_type}    options={ID_TYPES} onChange={(_, v) => setG("id_type", v)} />
                <LField  label="ID Number"  field="id_number"  value={form.guardian.id_number}  onChange={(_, v) => setG("id_number", v)} />
                <div className="col-span-2">
                  <LField label="Address" field="address" value={form.guardian.address} onChange={(_, v) => setG("address", v)} />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[12px] font-bold text-slate-600 mb-3">Fee Structure <span className="font-normal text-slate-400">(optional — can be filled later)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <LField  label="Tuition Fee (₹/mo)"    field="tuition_fee"       value={String(form.fees.tuition_fee)}       onChange={(_, v) => setFees("tuition_fee", Number(v))} placeholder="0" />
                <LField  label="Concession Amount (₹)" field="concession_amount" value={String(form.fees.concession_amount)} onChange={(_, v) => setFees("concession_amount", Number(v))} placeholder="0" />
                <LField  label="Concession Reason"     field="concession_reason" value={form.fees.concession_reason}        onChange={(_, v) => setFees("concession_reason", v)} placeholder="e.g. Staff ward" />
                <LField  label="Transport Fee (₹/mo)"  field="transport_fee"     value={String(form.fees.transport_fee)}     onChange={(_, v) => setFees("transport_fee", Number(v))} placeholder="0" />
                <LField  label="Admission Fee (₹)"     field="admission_fee"     value={String(form.fees.admission_fee)}     onChange={(_, v) => setFees("admission_fee", Number(v))} placeholder="0" />
                <LSelect label="Fee Status"            field="fee_status"        value={form.fees.fee_status}               options={FEE_STATUS} onChange={(_, v) => setFees("fee_status", v)} />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[12px] font-bold text-slate-600 mb-2">Remarks / Notes</p>
              <textarea rows={3} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Any additional notes for the admissions team…"
                value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
            </div>
          </div>
        )}

        {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>

        <div className="py-4 pt-0 shrink-0 border-t border-slate-100">
            <DialogFooter className="gap-2 px-8">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>Back</Button>
              )}
              {step < STEPS.length - 1 && (
                <Button size="sm" onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0 && !form.applicant_name.trim()}>
                  Next
                </Button>
              )}
              {step === STEPS.length - 1 && (
                <Button size="sm" onClick={handleSubmit} disabled={saving}>
                  {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> : null}
                  Submit Application
                </Button>
              )}
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
