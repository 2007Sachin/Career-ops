"use client";
import { NavButtons, CARD_STYLE, LABEL_STYLE, INPUT_STYLE } from "./_components";
import { Zap } from "lucide-react";

// Step 0: Welcome
export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#534AB7]/20 border border-[#534AB7]/40 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#534AB7]/10">
        <Zap className="w-8 h-8 text-[#7C71E8]" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
        Activate your <span className="text-[#7C71E8]">Pulse</span>
      </h1>
      <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto mb-8">
        Pulse-Ops autonomously tracks your technical work, scores it, and deploys tailored applications on your behalf. Setup takes under 3 minutes.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-10 text-left">
        {[
          { label: "Daily Ingestion", desc: "GitHub, LeetCode & more auto-synced every night" },
          { label: "Pulse Score", desc: "AI-scored metric proving your real engineering impact" },
          { label: "Auto-Apply", desc: "Agent deploys targeted applications without you lifting a finger" },
        ].map((item) => (
          <div key={item.label} className={CARD_STYLE}>
            <div style={LABEL_STYLE} className="mb-2">{item.label}</div>
            <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <NavButtons onNext={onNext} nextLabel="Get Started →" />
    </div>
  );
}

// Step 1: Profile
export function StepProfile({ data, onChange, onNext, onBack }: {
  data: any; onChange: (k: string, v: any) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <div style={LABEL_STYLE} className="mb-1">Step 2 of 6</div>
        <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
        <p className="text-slate-500 text-sm mt-1">This helps us personalize your Pulse Score and match targets.</p>
      </div>
      <div className={`${CARD_STYLE} space-y-5`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5" style={LABEL_STYLE}>Full Name</label>
            <input className={INPUT_STYLE} placeholder="Jane Doe" value={data.fullName} onChange={e => onChange("fullName", e.target.value)} />
          </div>
          <div>
            <label className="block mb-1.5" style={LABEL_STYLE}>Email</label>
            <input className={INPUT_STYLE} type="email" placeholder="you@example.com" value={data.email} onChange={e => onChange("email", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block mb-1.5" style={LABEL_STYLE}>Current Role / Title</label>
          <input className={INPUT_STYLE} placeholder="e.g. Senior Backend Engineer" value={data.currentRole} onChange={e => onChange("currentRole", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1.5" style={LABEL_STYLE}>Years of Experience</label>
          <input className={INPUT_STYLE} type="number" min={0} max={40} placeholder="4" value={data.yearsExp || ""} onChange={e => onChange("yearsExp", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1.5" style={LABEL_STYLE}>Past Internships / Companies (comma-separated)</label>
          <input className={INPUT_STYLE} placeholder="Google, Stripe, Zerodha" value={(data.internships || []).join(", ")} onChange={e => onChange("internships", e.target.value.split(",").map((s: string) => s.trim()))} />
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!data.fullName || !data.email} />
    </div>
  );
}

// Step 2: Goals
const DOMAINS = ["FinTech", "AI/ML", "Deep Tech", "DevOps", "SaaS", "Web3", "Defense", "Climate", "HealthTech", "E-Commerce"];

export function StepGoals({ data, onChange, onNext, onBack }: {
  data: any; onChange: (k: string, v: any) => void; onNext: () => void; onBack: () => void;
}) {
  const toggleDomain = (d: string) => {
    const cur: string[] = data.targetDomains || [];
    onChange("targetDomains", cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d]);
  };

  return (
    <div>
      <div className="mb-6">
        <div style={LABEL_STYLE} className="mb-1">Step 3 of 6</div>
        <h2 className="text-2xl font-bold text-white">Define your targets</h2>
        <p className="text-slate-500 text-sm mt-1">Pulse agents will only pursue opportunities that match your criteria.</p>
      </div>
      <div className={`${CARD_STYLE} space-y-6`}>
        <div>
          <label className="block mb-3" style={LABEL_STYLE}>Target Domains (pick all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map(d => {
              const active = (data.targetDomains || []).includes(d);
              return (
                <button key={d} onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    active ? "bg-[#534AB7]/20 border-[#534AB7] text-[#7C71E8]" : "bg-[#0a0a1a] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block mb-1.5" style={LABEL_STYLE}>Target Roles (e.g. "Staff Eng, Tech Lead")</label>
          <input className={INPUT_STYLE} placeholder="Backend Engineer, Platform Engineer" value={data.targetRoles || ""} onChange={e => onChange("targetRoles", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1.5" style={LABEL_STYLE}>Minimum Annual Salary (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className={`${INPUT_STYLE} pl-7`} type="number" placeholder="120000" value={data.minSalaryLPA || ""} onChange={e => onChange("minSalaryLPA", e.target.value)} />
          </div>
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={(data.targetDomains || []).length === 0} />
    </div>
  );
}
