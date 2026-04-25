"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faBell, faCircleCheck, faTriangleExclamation,
  faCircleInfo, faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";

interface NavbarProps {
  title: string;
  description?: string;
}

export default function Navbar({ title, description }: NavbarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold text-[#212529] leading-tight">{title}</h1>
        {description && (
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"
          />
          <input
            placeholder="Search..."
            className="pl-8 h-8 w-48 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#007BFF] focus:bg-white transition-colors pr-2.5"
          />
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
              <FontAwesomeIcon icon={faBell} className="text-[14px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FFCA2B] rounded-full" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-[#212529]">Notifications</p>
              <span className="text-[10px] font-medium bg-[#FFCA2B]/20 text-[#b38a00] px-2 py-0.5 rounded-full">3 new</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-[11px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#212529] leading-snug">Fee payment confirmed</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Rahul Sharma — ₹12,500</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">2 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faUserPlus} className="text-blue-500 text-[11px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#212529] leading-snug">New student enrolled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Priya Patel — Class 10-A</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">1 hr ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-500 text-[11px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#212529] leading-snug">Attendance below threshold</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Class 9-B — 68% this week</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">3 hr ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-slate-400 text-[11px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#212529] leading-snug">Exam schedule published</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Term 2 finals — May 12–22</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Yesterday</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100">
              <button className="text-[12px] text-[#007BFF] hover:underline font-medium">View all notifications</button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
