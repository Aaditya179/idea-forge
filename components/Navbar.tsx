"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import { Scale, Globe, LogOut } from "lucide-react";

interface NavbarProps {
  role: UserRole;
  fullName: string;
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

const roleBadgeColors: Record<UserRole, string> = {
  citizen: "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]",
  officer: "bg-[#F3F0FF] text-violet-700 border border-violet-200",
  admin: "bg-[#ECFDF5] text-emerald-700 border border-emerald-200",
};

export default function Navbar({ role, fullName }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const links = roleLinks[role] || [];
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E7E0D8] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${role}`} className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#B45309]" />
            </div>
            <span className="text-[14px] font-extrabold tracking-tight hidden sm:block">
              <span className="text-[#1C1917]">CIVIC</span>
              <span className="text-[#B45309]">PULSE</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF5EE] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#E7E0D8] text-xs font-medium text-[#78716C] hover:border-[#B45309] transition-colors bg-white">
              <Globe className="w-3.5 h-3.5" />
              <span>EN</span>
            </button>

            {/* Role badge + name */}
            <div className="hidden sm:flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadgeColors[role]}`}>
                {role}
              </span>
            </div>

            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#B45309] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#78716C] hover:text-[#C2410C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="sm:hidden flex items-center gap-1 pb-3 -mt-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF5EE] transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
