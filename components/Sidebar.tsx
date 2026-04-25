"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableColumns, faUsers, faGraduationCap, faChalkboard,
  faCalendarDays, faCreditCard, faClipboardList, faChartColumn,
  faBus, faBullhorn, faChartPie, faGear,
  faRightFromBracket, faCircleQuestion, faChevronUp, faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { label: "Dashboard",          icon: faTableColumns,  href: "/"             },
  { label: "Students",           icon: faUsers,         href: "/students"     },
  { label: "Teachers",           icon: faGraduationCap, href: "/teachers"     },
  { label: "Classes & Subjects", icon: faChalkboard,    href: "/classes"      },
  { label: "Timetable",          icon: faCalendarDays,  href: "/timetable"    },
  { label: "Fees & Finance",     icon: faCreditCard,    href: "/fees"         },
  { label: "Exams & Results",    icon: faClipboardList, href: "/exams"        },
  { label: "Attendance",         icon: faChartColumn,   href: "/attendance"   },
  { label: "Transport",          icon: faBus,           href: "/transport"    },
  { label: "Announcements",      icon: faBullhorn,      href: "/announcements"},
  { label: "Reports",            icon: faChartPie,     href: "/reports"      },
  { label: "Settings",           icon: faGear,          href: "/settings"     },
];

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer rounded rectangle */}
      <rect
        x="1.5" y="1.5"
        width="15" height="15"
        rx="2.5"
        stroke="#94a3b8"
        strokeWidth="1.4"
        fill="none"
      />
      {/* Inner vertical line — slides right when collapsed */}
      <line
        x1="5.5" y1="5"
        x2="5.5" y2="13"
        stroke="#64748b"
        strokeWidth="1.4"
        strokeLinecap="round"
        style={{
          transform: collapsed ? "translateX(6px)" : "translateX(0px)",
          transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        transition: "width 280ms cubic-bezier(0.4,0,0.2,1)",
      }}
      className="relative flex flex-col h-screen bg-white border-r border-slate-200 shrink-0 sticky top-0 z-40 overflow-visible"
    >
      {/* Logo */}
      <div className="flex items-center border-b border-slate-200 px-3 py-[11px] shrink-0 gap-2 overflow-hidden h-14">
        <Image
          src="/logo.png"
          alt="KD Institute"
          width={32}
          height={32}
          className="rounded-md shrink-0 object-contain"
        />
        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 160,
            transition: "opacity 180ms ease, max-width 280ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <p className="text-[#212529] font-bold text-[12px] leading-tight whitespace-nowrap">KD Institute</p>
          <p className="text-slate-400 text-[10px] mt-0.5 whitespace-nowrap">of Advance Education</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 flex flex-col gap-0.5">
        {navItems.map(({ label, icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-md text-[13px] font-medium whitespace-nowrap mx-1.5 transition-colors ${
                active
                  ? "bg-[#007BFF] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#212529]"
              }`}
              style={{
                height: 36,
                // Fixed left padding — icon NEVER moves
                paddingLeft: 12,
                paddingRight: 12,
              }}
            >
              <FontAwesomeIcon
                icon={icon}
                className="w-[14px] shrink-0"
                style={{
                  // Only margin animates, not position
                  marginRight: collapsed ? 0 : 10,
                  transition: "margin-right 280ms cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              <span
                className="overflow-hidden"
                style={{
                  opacity: collapsed ? 0 : 1,
                  maxWidth: collapsed ? 0 : 160,
                  transition: "opacity 180ms ease, max-width 280ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => {
          setCollapsed((c) => !c);
          if (!collapsed) setMenuOpen(false);
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 150ms ease, box-shadow 150ms ease",
        }}
        className="shadow-none bg-white cursor-pointer z-50 m-3 ml-4"
      >
        <CollapseIcon collapsed={collapsed} />
      </button>

      {/* Footer */}
      <div className="border-t border-slate-200 shrink-0">
        {/* Collapsible menu — hidden when sidebar is collapsed */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            maxHeight: menuOpen && !collapsed ? 120 : 0,
            opacity: menuOpen && !collapsed ? 1 : 0,
            transition: "max-height 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
          }}
        >
          <div className="px-2 pt-2 pb-1 flex flex-col gap-0.5">
            <Link
              href="#"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-slate-600 hover:bg-slate-100 hover:text-[#212529] transition-colors"
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="w-[13px] shrink-0" />
              <span>Help &amp; Support</span>
            </Link>
            <button className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-red-500 hover:bg-red-50 transition-colors w-full">
              <FontAwesomeIcon icon={faRightFromBracket} className="w-[13px] shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => !collapsed && setMenuOpen((o) => !o)}
          title={collapsed ? "Administrator" : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#FFCA2B] flex items-center justify-center text-[#212529] text-[10px] font-bold shrink-0">
            AD
          </div>
          <div
            className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 200,
              transition: "opacity 180ms ease, max-width 280ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-semibold text-[#212529] leading-tight truncate whitespace-nowrap">Administrator</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate whitespace-nowrap">admin@kidiaedu.in</p>
            </div>
            <FontAwesomeIcon
              icon={menuOpen ? faChevronDown : faChevronUp}
              className="text-slate-400 text-[10px] shrink-0"
            />
          </div>
        </button>
      </div>
    </aside>
  );
}