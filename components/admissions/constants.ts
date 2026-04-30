import { faClock, faCircleDot, faCheckCircle, faBan, faGraduationCap, faUser } from "@fortawesome/free-solid-svg-icons";
import type { Guardian, FeeInfo } from "@/lib/api";

export const ACADEMIC_YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"];
export const ALL_STATUSES   = ["Pending", "Under Review", "Approved", "Rejected", "Enrolled"];

export const EARLY_CLASSES = new Set(["Nursery", "LKG", "UKG", "Nursery – Jr", "Nursery – Sr"]);
export const CLASS_LIST = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

export const statusMeta: Record<string, { color: string; icon: typeof faUser }> = {
  "Pending":      { color: "bg-amber-50 text-amber-700 border-amber-200",       icon: faClock        },
  "Under Review": { color: "bg-blue-50 text-blue-700 border-blue-200",          icon: faCircleDot    },
  "Approved":     { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: faCheckCircle  },
  "Rejected":     { color: "bg-red-50 text-red-700 border-red-200",             icon: faBan          },
  "Enrolled":     { color: "bg-violet-50 text-violet-700 border-violet-200",    icon: faGraduationCap },
};

export const BLANK_GUARDIAN: Guardian = {
  name: "", relation: "", phone: "", email: "", address: "", id_type: "", id_number: "", occupation: "",
};

export const BLANK_FEES: FeeInfo = {
  tuition_fee: 0, concession_amount: 0, concession_reason: "",
  transport_fee: 0, other_monthly_fee: 0,
  admission_fee: 0, admission_fee_paid: 0,
  book_fee: 0, book_fee_paid: 0,
  uniform_fee: 0, uniform_fee_paid: 0,
  fee_status: "Paid",
};

export const BLANK_FORM = {
  applicant_name: "", dob: "", gender: "", blood_group: "", applying_for_class: "",
  section_preference: "", academic_year: "2025-26",
  phone: "", email: "", address: "",
  previous_school: "", tc_number: "", cc_number: "",
  student_id_type: "", student_id_number: "",
  status: "Pending", remarks: "", applied_date: "",
  fees: { ...BLANK_FEES },
  guardian: { ...BLANK_GUARDIAN },
};
