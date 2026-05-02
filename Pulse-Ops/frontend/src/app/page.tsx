import Link from "next/link";
import { ArrowRight, Check, X, Zap, Users, BarChart3, Bot, ShieldCheck, Clock, Target, Briefcase, Star, FileText, Search } from "lucide-react";

const NAV_LINKS = [
  { label: "For Job Seekers", href: "#candidates" },
  { label: "For Recruiters", href: "#recruiters" },
  { label: "How It Works", href: "#how-it-works" },
];

const CANDIDATE_FEATURES = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Verified Career Profile",
    desc: "We build a rich, verified profile from your work history, skills, and achievements — so your applications speak for themselves.",
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: "AI Agents Apply For You",
    desc: "Deploy autonomous agents that scout matching jobs 24/7, tailor your resume and cover letter to each role, and submit applications — while you focus on what matters.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Live Application Pipeline",
    desc: "Track every application in one dashboard. See status, match score, and agent actions in real-time — no more spreadsheet chaos or black holes.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Precision Job Matching",
    desc: "No more applying to hundreds of irrelevant roles. Our engine matches you to positions where your actual experience and skills fit — and only those.",
  },
];

const RECRUITER_FEATURES = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Pre-Verified Candidates",
    desc: "Every candidate in your feed has a verified Pulse Score built from their real career history and skills — not just what they claim on a CV.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant Role Matching",
    desc: "Post your requirements once. Our engine continuously surfaces candidates whose verified background matches your role — across any industry or function.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Structured Hiring Pipeline",
    desc: "Built-in shortlisting, candidate unlocking, and hiring stages. Your entire funnel in one view — no ATS duct-taped to a spreadsheet.",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Zero Sourcing Overhead",
    desc: "Stop spending hours searching job boards and LinkedIn. Your talent feed updates automatically as new verified candidates join the platform.",
  },
];

const COMPARISON = [
  { aspect: "Applying for jobs",       traditional: "Submit 200 applications manually", careerops: "AI agents apply precisely on your behalf" },
  { aspect: "Candidate verification",  traditional: "CV claims — easily exaggerated",   careerops: "Verified career history, scored objectively" },
  { aspect: "Recruiter sourcing",      traditional: "Hours of manual searching",         careerops: "Auto-matched feed, updated continuously" },
  { aspect: "Job relevance",           traditional: "Keyword spam, low signal-to-noise", careerops: "Skill-matrix match — only relevant roles shown" },
  { aspect: "Application visibility",  traditional: "Send and pray — complete black hole", careerops: "Live pipeline with real-time agent updates" },
  { aspect: "Time to hire",            traditional: "Weeks of unstructured back-and-forth", careerops: "Pre-screened, scored candidates, ready to interview" },
];

const STATS = [
  { value: "94%",  label: "Match precision rate" },
  { value: "0",    label: "Manual applications needed" },
  { value: "24/7", label: "Agent uptime" },
  { value: "3×",   label: "Faster time-to-hire" },
];

const INDUSTRIES = [
  "Marketing", "Sales", "Design", "Finance", "Operations",
  "Product", "HR & People", "Healthcare", "Legal", "Data & Analytics",
  "Customer Success", "Engineering",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1e3060] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1e3060]">CareerOps</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/login?signup=true" className="text-sm font-semibold bg-[#1e3060] text-white px-5 py-2.5 rounded-lg hover:bg-[#162448] transition-colors shadow-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f8f9ff] border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,48,96,0.07)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.06)_0%,_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium tracking-wide">Autonomous Career Intelligence — For Everyone</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.08] max-w-5xl mx-auto text-slate-900">
            Stop Applying.<br />
            <span className="text-[#1e3060]">Start Landing.</span>
          </h1>

          <p className="mt-7 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            CareerOps replaces the exhausting job hunt with autonomous agents — for everyone who&apos;s tired of black holes and unread CVs, and recruiters who are tired of wading through noise.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?role=candidate&signup=true"
              className="group inline-flex items-center gap-2.5 bg-[#1e3060] hover:bg-[#162448] text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-[#1e3060]/20 hover:shadow-xl hover:shadow-[#1e3060]/25 hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5" />
              I&apos;m Looking for a Job
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login?role=recruiter&signup=true"
              className="group inline-flex items-center gap-2.5 border-2 border-slate-200 hover:border-[#1e3060] text-slate-700 hover:text-[#1e3060] font-bold px-8 py-4 rounded-xl text-base transition-all bg-white hover:bg-[#f8f9ff] hover:-translate-y-0.5"
            >
              <Briefcase className="w-5 h-5" />
              I&apos;m Hiring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Industry tags */}
          <div className="mt-14 flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
            {INDUSTRIES.map(ind => (
              <span key={ind} className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full shadow-sm font-medium">
                {ind}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black text-[#1e3060] tracking-tight">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1.5 font-medium uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Job Seekers */}
      <section id="candidates" className="py-28 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Search className="w-4 h-4" /> For Job Seekers
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Your job search,<br />
              <span className="text-[#1e3060]">fully automated.</span>
            </h2>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed">
              Tell CareerOps who you are and what you&apos;re looking for — once. We build your verified career profile and deploy AI agents that scout, tailor, and apply to the right roles around the clock. Works for any industry, any function, any level.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "No more sending hundreds of cold applications",
                "Your real experience, verified — not just claimed",
                "Agents work 24/7 while you live your life",
                "One dashboard for your entire job search pipeline",
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/login?role=candidate&signup=true" className="inline-flex items-center gap-2 mt-10 bg-[#1e3060] text-white font-bold px-7 py-3.5 rounded-xl hover:bg-[#162448] transition-colors shadow-md shadow-[#1e3060]/20">
              Start Your Job Search <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CANDIDATE_FEATURES.map(f => (
              <div key={f.title} className="bg-[#f8f9ff] border border-slate-100 rounded-2xl p-6 hover:border-[#1e3060]/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#1e3060]/10 rounded-xl flex items-center justify-center text-[#1e3060] mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Recruiters */}
      <section id="recruiters" className="py-28 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 order-2 lg:order-1">
              {RECRUITER_FEATURES.map(f => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-400 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Briefcase className="w-4 h-4" /> For Recruiters & Hiring Managers
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Hire faster with<br />
                <span className="text-blue-400">verified talent.</span>
              </h2>
              <p className="mt-5 text-lg text-slate-400 leading-relaxed">
                Every candidate in your feed comes with a Pulse Score built from their verified career history — not just claims. Define your role requirements once, and let the matching engine surface the right people automatically, from any industry or background.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Browse only pre-screened, scored candidates",
                  "Verified career history — not just self-reported claims",
                  "Automated matching across any role or industry",
                  "Structured pipeline from match to offer",
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                    </div>
                    <span className="text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/login?role=recruiter&signup=true" className="inline-flex items-center gap-2 mt-10 bg-blue-500 hover:bg-blue-600 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/25">
                Access Talent Feed <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="how-it-works" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 mb-6">
            <Star className="w-4 h-4" /> Why CareerOps
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Not another job board.
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            Traditional portals were built in 2005. CareerOps is built for the way people actually find and fill jobs today.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="p-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Feature</div>
            <div className="p-5 text-sm font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200 flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" /> Traditional Portals
            </div>
            <div className="p-5 text-sm font-bold text-[#1e3060] uppercase tracking-wider border-l border-slate-200 flex items-center gap-2 bg-blue-50/50">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} /> CareerOps
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <div key={row.aspect} className={`grid grid-cols-3 border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
              <div className="p-5 text-sm font-semibold text-slate-700">{row.aspect}</div>
              <div className="p-5 border-l border-slate-100 flex items-start gap-2">
                <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-500">{row.traditional}</span>
              </div>
              <div className="p-5 border-l border-slate-100 flex items-start gap-2 bg-blue-50/30">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={3} />
                <span className="text-sm font-medium text-slate-700">{row.careerops}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#f8f9ff] border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-slate-500 text-lg">Simple onboarding for both sides of the hiring table.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 bg-[#1e3060] rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Job Seeker Journey</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Create your profile", desc: "Tell us your experience, skills, and the kind of role you're looking for — in any industry." },
                  { step: "02", title: "Get your Pulse Score", desc: "We verify your career history and compute an objective match score employers can trust." },
                  { step: "03", title: "Agents go to work", desc: "AI agents scout matching roles 24/7, tailor your application to each one, and submit on your behalf." },
                  { step: "04", title: "Track everything", desc: "Every application lives in your pipeline dashboard with live status updates." },
                ].map(s => (
                  <div key={s.step} className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-[#1e3060] text-white text-sm font-black flex items-center justify-center shrink-0">{s.step}</div>
                    <div>
                      <h4 className="font-bold text-slate-900">{s.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Recruiter Journey</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Set up your company", desc: "Create your organization profile and define your hiring preferences." },
                  { step: "02", title: "Post your role requirements", desc: "Describe the skills, experience level, and context you need — once." },
                  { step: "03", title: "Browse matched candidates", desc: "Your feed auto-populates with scored, verified candidates who fit your role." },
                  { step: "04", title: "Build your pipeline", desc: "Shortlist, unlock contact details, and move candidates from match to offer." },
                ].map(s => (
                  <div key={s.step} className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white text-sm font-black flex items-center justify-center shrink-0">{s.step}</div>
                    <div>
                      <h4 className="font-bold text-slate-900">{s.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">
          Ready to stop<br />
          <span className="text-[#1e3060]">doing it the old way?</span>
        </h2>
        <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto">
          Join job seekers and hiring teams across every industry who have replaced the manual grind with autonomous, intelligent career operations.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login?role=candidate&signup=true"
            className="group inline-flex items-center gap-2.5 bg-[#1e3060] hover:bg-[#162448] text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-[#1e3060]/20 hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" /> Find a Job with AI <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?role=recruiter&signup=true"
            className="group inline-flex items-center gap-2.5 border-2 border-slate-200 hover:border-[#1e3060] text-slate-700 hover:text-[#1e3060] font-bold px-8 py-4 rounded-xl text-base transition-all bg-white hover:-translate-y-0.5"
          >
            <Briefcase className="w-5 h-5" /> Start Hiring Smarter <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1e3060] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <span className="font-bold text-slate-700">CareerOps</span>
            <span className="text-xs text-slate-400 ml-2">© 2026 — Intelligent Career Operations</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#candidates" className="hover:text-slate-700 transition-colors">Job Seekers</a>
            <a href="#recruiters" className="hover:text-slate-700 transition-colors">Recruiters</a>
            <Link href="/login" className="hover:text-slate-700 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
