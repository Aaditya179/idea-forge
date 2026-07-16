"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import { Scale, Globe, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

interface NavbarProps {
  role: UserRole;
  fullName: string;
  departmentName?: string | null;
}

const roleLinks: Record<UserRole, { href: string; label: string }[]> = {
  citizen: [
    { href: "/citizen", label: "My Complaints" },
    { href: "/citizen/new", label: "New Complaint" },
  ],
  officer: [
    { href: "/officer", label: "Dashboard" },
    { href: "/officer/analytics", label: "Analytics" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/ai-insights", label: "AI Insights" },
    { href: "/admin/complaints", label: "All Complaints" },
  ],
};

export default function Navbar({ role, fullName, departmentName }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const links = roleLinks[role] || [];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e6dfd3] bg-[#faf6f0]/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - exact emblem and typography from landing page */}
          <Link href={`/${role}`} className="flex items-center gap-3 group focus:outline-none shrink-0">
            <img
              src="/emblem.png"
              alt="Government of India Emblem"
              className="h-9 sm:h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-tight text-[#1c1917] flex items-center gap-1.5">
                CivicPulse
              </span>
              <span className="text-[10px] text-[#7a6f64] font-medium uppercase tracking-wider block -mt-0.5">
                India&apos;s Civic Intelligence
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#4a423a] hover:text-[#c86d28] hover:bg-white transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {role === "citizen" && <NotificationBell />}

            {(role === "officer" || role === "admin") && (
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-sm font-semibold text-[#1c1917] leading-tight">{fullName}</span>
                <span className="text-xs text-[#B45309] font-medium block mt-0.5">
                  {departmentName || (role === "admin" ? "Executive Command" : "Municipal Officer")}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-[#B45309] text-white text-sm font-semibold hover:bg-[#92400E] transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="sm:hidden flex items-center gap-1 pb-3 -mt-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4a423a] hover:text-[#c86d28] hover:bg-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
