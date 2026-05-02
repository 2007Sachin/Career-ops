"use client";
import { NavButtons, CARD_STYLE, LABEL_STYLE } from "./_components";
import { CheckCircle2, Star, Zap, Shield } from "lucide-react";

const MONO = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

const TESTIMONIALS = [
  { name: "Arjun M.", role: "Backend Eng → Ather Energy", quote: "Pulse-Ops submitted 4 applications while I slept. One became my current job.", score: 91 },
  { name: "Priya S.", role: "SDE-2 → Zerodha", quote: "The Pulse Score finally gave recruiters a way to see work I couldn't articulate in a resume.", score: 86 },
  { name: "Rohan K.", role: "Infra Lead → Postman", quote: "Connecting GitHub took 30 seconds. Three weeks later I had competing offers.", score: 79 },
];

export function StepSocialProof({ data, onNext, onBack }: {
  data: any; onNext: () => void; onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-8 text-center">
        <div style={LABEL_STYLE} className="mb-2 flex justify-center">Step 6 of 6 — Almost there</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Join <span className="text-[#7C71E8]">2,400+ engineers</span> already on autopilot
        </h2>
        <p className="text-slate-500 text-sm">Here's what happened after they set up Pulse-Ops.</p>
      </div>

      <div className="space-y-3 mb-8">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className={CARD_STYLE + " flex items-start gap-4"}>
            <div className="w-10 h-10 rounded-full bg-[#534AB7]/20 border border-[#534AB7]/30 flex items-center justify-center shrink-0 text-[#7C71E8] font-bold text-sm" style={MONO}>
              {t.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs" style={MONO}>{t.role}</div>
                </div>
                <div className="flex items-center gap-1 bg-[#534AB7]/10 border border-[#534AB7]/20 rounded-lg px-2 py-1">
                  <Zap className="w-3 h-3 text-[#7C71E8]" />
                  <span className="text-[#7C71E8] font-bold text-xs" style={MONO}>{t.score}</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed italic">"{t.quote}"</p>
              <div className="flex gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#534AB7] text-[#534AB7]" />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={CARD_STYLE + " flex items-center gap-4 mb-2"}>
        <Shield className="w-8 h-8 text-[#7C71E8] shrink-0" />
        <div>
          <div className="text-white font-semibold text-sm mb-0.5">Privacy-first by design</div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Your credentials are stored encrypted with AES-256. Your full name and contact are <span className="text-white">never shared</span> with recruiters until <span className="text-white">you approve</span> the unlock.
          </p>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Enter Command Center →" isLast />
    </div>
  );
}
