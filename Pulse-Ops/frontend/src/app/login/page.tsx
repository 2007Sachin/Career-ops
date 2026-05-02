"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bot, Briefcase, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

type Role = "candidate" | "recruiter";
type Mode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole]     = useState<Role>((params.get("role") as Role) ?? "candidate");
  const [mode, setMode]     = useState<Mode>(params.get("signup") === "true" ? "signup" : "signin");
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [name, setName]     = useState("");
  const [showPass, setShow] = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    const r = params.get("role") as Role;
    if (r === "candidate" || r === "recruiter") setRole(r);
    if (params.get("signup") === "true") setMode("signup");
  }, [params]);

  const switchRole = (newRole: Role) => {
    setRole(newRole);
    resetError();
    const sp = new URLSearchParams(params.toString());
    sp.set("role", newRole);
    router.replace(`/login?${sp.toString()}`);
  };

  const [checkEmail, setCheckEmail] = useState(false);

  const resetError = () => setError("");

  function friendlyError(msg: string): string {
    if (/email rate limit/i.test(msg))
      return "Too many sign-up attempts. Please wait a few minutes and try again, or disable email confirmation in your Supabase dashboard (Auth → Providers → Email → uncheck \"Confirm email\").";
    if (/email not confirmed/i.test(msg))
      return "Please confirm your email first — check your inbox for a link from Supabase.";
    if (/invalid login credentials/i.test(msg))
      return "Incorrect email or password.";
    if (/user already registered/i.test(msg))
      return "An account with this email already exists. Try signing in instead.";
    if (/password should be at least/i.test(msg))
      return "Password must be at least 6 characters.";
    return msg;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoad(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role } },
        });
        if (signUpErr) throw signUpErr;
        if (!data.user) throw new Error("Sign-up failed — please try again.");

        // If email confirmation is enabled, data.session will be null
        if (!data.session) {
          setCheckEmail(true);
          setLoad(false);
          return;
        }

        // Upsert public.users row with role
        const { error: upsertErr } = await supabase.from("users").upsert({
          id: data.user.id,
          email,
          full_name: name,
          role,
        }, { onConflict: "id" });
        if (upsertErr) console.warn("users upsert:", upsertErr.message);

        // Redirect
        if (role === "recruiter") {
          router.push("/recruiter/onboarding");
        } else {
          router.push("/onboarding?reset=1");
        }
        return;
      }

      // Sign in
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      if (!data.user) throw new Error("Sign-in failed.");

      // Determine redirect based on role column in public.users
      const { data: profile } = await supabase
        .from("users")
        .select("role, onboarding_completed")
        .eq("id", data.user.id)
        .single();

      const userRole: Role = (profile?.role as Role) ?? role;

      if (userRole === "recruiter") {
        const { data: recProfile } = await supabase
          .from("recruiter_profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .single();

        if (recProfile?.onboarding_completed) {
          // sync localStorage for recruiter layout
          const { data: rp } = await supabase
            .from("recruiter_profiles")
            .select("*")
            .eq("user_id", data.user.id)
            .single();
          if (rp) {
            localStorage.setItem("recruiter_onboarded", "true");
            localStorage.setItem("recruiter_profile", JSON.stringify({
              name: rp.name,
              title: rp.title,
              email: rp.email,
              companyName: rp.company_name,
              companyIndustry: rp.company_industry,
              companySize: rp.company_size,
              companyWebsite: rp.company_website,
            }));
          }
          router.push("/recruiter/dashboard");
        } else {
          router.push("/recruiter/onboarding");
        }
      } else {
        router.push(profile?.onboarding_completed ? "/dashboard" : "/onboarding?reset=1");
      }
    } catch (err: unknown) {
      setError(friendlyError((err as Error).message ?? "Something went wrong."));
    } finally {
      setLoad(false);
    }
  }

  const isCandidate = role === "candidate";

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      {/* Minimal nav */}
      <nav className="h-14 bg-white border-b border-slate-100 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1e3060] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <span className="font-bold text-[#1e3060]">CareerOps</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Check-email state */}
          {checkEmail && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-1">
                We sent a confirmation link to <span className="font-semibold text-slate-700">{email}</span>.
              </p>
              <p className="text-slate-400 text-sm mb-6">Click the link to activate your account, then come back and sign in.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left mb-5">
                <p className="text-xs font-bold text-amber-700 mb-1">Testing / Development?</p>
                <p className="text-xs text-amber-600">Disable email confirmation in your Supabase dashboard: <span className="font-semibold">Authentication → Providers → Email → uncheck "Confirm email"</span>. Then users log in instantly after signup.</p>
              </div>
              <button onClick={() => { setCheckEmail(false); setMode("signin"); }}
                className="w-full h-11 rounded-xl bg-[#1e3060] text-white font-bold text-sm hover:bg-[#162448] transition-colors">
                Back to Sign In
              </button>
            </div>
          )}

          {!checkEmail && (<>
          {/* Role toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex mb-8 shadow-sm">
            <button
              onClick={() => switchRole("candidate")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                isCandidate
                  ? "bg-[#1e3060] text-white shadow-md shadow-[#1e3060]/20"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Bot className="w-4 h-4" /> Candidate
            </button>
            <button
              onClick={() => switchRole("recruiter")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                !isCandidate
                  ? "bg-[#1e3060] text-white shadow-md shadow-[#1e3060]/20"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Briefcase className="w-4 h-4" /> Recruiter
            </button>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header band */}
            <div className={`px-8 pt-8 pb-6 border-b border-slate-100 ${isCandidate ? "bg-gradient-to-r from-[#f0f4ff] to-white" : "bg-gradient-to-r from-slate-50 to-white"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isCandidate ? "bg-[#1e3060]" : "bg-slate-800"}`}>
                {isCandidate ? <Bot className="w-6 h-6 text-white" /> : <Briefcase className="w-6 h-6 text-white" />}
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {mode === "signin"
                  ? isCandidate ? "Welcome back" : "Partner portal"
                  : isCandidate ? "Activate your Pulse" : "Start hiring smarter"}
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                {mode === "signin"
                  ? isCandidate ? "Sign in to your candidate dashboard." : "Sign in to access your talent feed."
                  : isCandidate ? "Create your account and connect your activity." : "Set up your recruiter account and post roles."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                  <input
                    type="text"
                    required
                    placeholder={isCandidate ? "Alex Johnson" : "Jordan Lee"}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3060]/30 focus:border-[#1e3060] transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {isCandidate ? "Email address" : "Corporate email"}
                </label>
                <input
                  type="email"
                  required
                  placeholder={isCandidate ? "you@example.com" : "recruiter@company.com"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3060]/30 focus:border-[#1e3060] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPass(e.target.value)}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3060]/30 focus:border-[#1e3060] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70 ${
                  isCandidate
                    ? "bg-[#1e3060] hover:bg-[#162448] shadow-[#1e3060]/20"
                    : "bg-slate-800 hover:bg-slate-900 shadow-slate-800/20"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign in" : isCandidate ? "Create account" : "Create recruiter account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Mode switcher */}
            <div className="px-8 pb-7 text-center">
              <p className="text-sm text-slate-500">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => { setMode("signup"); resetError(); }} className="font-semibold text-[#1e3060] hover:underline">
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => { setMode("signin"); resetError(); }} className="font-semibold text-[#1e3060] hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to CareerOps&apos;s terms of service and privacy policy.
          </p>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
