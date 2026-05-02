"use client";
import React from "react";
import { CheckCircle2 } from "lucide-react";

const STEPS = ["Welcome", "Video", "Profile", "Goals", "Connect", "Sync", "You're In"];

const MONO = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

export function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-[#534AB7] text-white"
                    : active
                    ? "bg-[#534AB7]/20 text-[#7C71E8] ring-2 ring-[#534AB7] ring-offset-2 ring-offset-[#0a0a1a]"
                    : "bg-[#111127] text-slate-500 border border-white/10"
                }`}
                style={MONO}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-[9px] mt-1.5 uppercase tracking-widest transition-colors ${
                  active ? "text-[#7C71E8]" : done ? "text-slate-400" : "text-slate-600"
                }`}
                style={MONO}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mt-[-14px] transition-colors duration-300 ${
                  i < current ? "bg-[#534AB7]" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled = false,
  isLast = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex justify-between items-center mt-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          style={MONO}
        >
          ← Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
          isLast
            ? "bg-[#534AB7] hover:bg-[#6259d1] text-white shadow-lg shadow-[#534AB7]/30 hover:shadow-[#534AB7]/50 disabled:opacity-40"
            : "bg-[#534AB7] hover:bg-[#6259d1] text-white shadow-lg shadow-[#534AB7]/20 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
        style={MONO}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export const CARD_STYLE = "bg-[#111127] border border-white/[0.08] rounded-2xl p-6";
export const LABEL_STYLE: React.CSSProperties = { ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#7C71E8" };
export const INPUT_STYLE = "w-full bg-[#0a0a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/50 transition-all";
