"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Users, LayoutDashboard, ArrowLeft, LogOut } from "lucide-react";

interface RecruiterProfile {
  name: string;
  companyName: string;
}

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("recruiter_profile");
    if (raw) {
      try { setProfile(JSON.parse(raw)); } catch {}
    }
  }, []);

  const isOnboarding = pathname?.startsWith("/recruiter/onboarding");
  if (isOnboarding) return <>{children}</>;

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "R";

  const companyName = profile?.companyName ?? "Your Company";

  const navLinks = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/recruiter/feed",      label: "Talent Feed", icon: <Users className="w-4 h-4" /> },
    { href: "/recruiter/jobs",      label: "Manage Roles", icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mr-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3060] rounded flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Pulse<span className="text-[#1e3060]">Hire</span>
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/recruiter/dashboard" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1e3060]/10 text-[#1e3060]"
                    : "text-slate-600 hover:text-[#1e3060] hover:bg-slate-100"
                }`}
              >
                {icon} {label}
              </Link>
            );
          })}

          <div className="w-px h-5 bg-slate-200 mx-2" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1e3060] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{profile?.name ?? "Recruiter"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{companyName}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("recruiter_onboarded");
                localStorage.removeItem("recruiter_profile");
                localStorage.removeItem("recruiter_roles");
                router.push("/recruiter");
              }}
              className="ml-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
