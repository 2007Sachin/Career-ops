"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
export interface Internship {
  id: string;
  company: string;
  role: string;
  duration: string;
  projectDescription: string;
  skills: string[];
}

export interface ProfileFormData {
  fullName: string;
  email: string;
  currentRole: string;
  targetDomains: string[];
  targetRoles: string;
  minSalaryLPA: string;
  locationPreference: string;
  internships: Internship[];
}

interface ProfileStepProps {
  data: ProfileFormData;
  onChange: (key: keyof ProfileFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ─── Domain tags config ─────────────────────────────────────── */
const DOMAINS: { label: string; color: string; bg: string; border: string }[] = [
  { label: "EV / Electric Mobility", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.35)" },
  { label: "SaaS / B2B",             color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)" },
  { label: "FinTech",                color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.35)"  },
  { label: "Manufacturing",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)"  },
  { label: "AI / ML",                color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)"  },
  { label: "HealthTech",             color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)"  },
  { label: "E-commerce",             color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.35)" },
  { label: "Other",                  color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
];

/* ─── Style constants ────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a1a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const inputErrStyle: React.CSSProperties = {
  ...inputStyle,
  border: "1px solid rgba(248,113,113,0.6)",
};

const labelStyle: React.CSSProperties = {
  ...MONO,
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#7C71E8",
  display: "block",
  marginBottom: "6px",
};

const cardStyle: React.CSSProperties = {
  background: "#111127",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "24px",
};

/* ─── Internship inline form ─────────────────────────────────── */
const EMPTY_INTERN = (): Omit<Internship, "id"> => ({
  company: "", role: "", duration: "", projectDescription: "", skills: [],
});

function InternshipForm({ onSave, onCancel }: {
  onSave: (i: Omit<Internship, "id">) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(EMPTY_INTERN());
  const [skillInput, setSkillInput] = useState("");
  const skillRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof draft, v: any) => setDraft(p => ({ ...p, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !draft.skills.includes(s)) set("skills", [...draft.skills, s]);
    setSkillInput("");
    skillRef.current?.focus();
  };

  const handleSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
    if (e.key === "Backspace" && !skillInput && draft.skills.length) {
      set("skills", draft.skills.slice(0, -1));
    }
  };

  const canSave = draft.company.trim() && draft.role.trim();

  return (
    <div style={{ background: "#0d0d22", border: "1px solid rgba(83,74,183,0.3)", borderRadius: "10px", padding: "18px", marginTop: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        {[
          { key: "company", label: "Company name", placeholder: "e.g. Zerodha, Google" },
          { key: "role",    label: "Role / title",  placeholder: "e.g. Data Engineering Intern" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input
              style={inputStyle}
              placeholder={placeholder}
              value={(draft as any)[key]}
              onChange={e => set(key as any, e.target.value)}
              onFocus={e => (e.target.style.borderColor = "#534AB7")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Duration</label>
        <input
          style={inputStyle}
          placeholder="e.g. Jun 2024 – Dec 2024 (6 months)"
          value={draft.duration}
          onChange={e => set("duration", e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#534AB7")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Key project / contribution</label>
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
          placeholder="e.g. Built an automated ETL pipeline for EV battery test data"
          value={draft.projectDescription}
          onChange={e => set("projectDescription", e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#534AB7")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Skills used</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 10px", minHeight: "42px", alignItems: "center" }}>
          {draft.skills.map(s => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(83,74,183,0.2)", border: "1px solid rgba(83,74,183,0.4)", borderRadius: "5px", padding: "2px 8px", fontSize: "12px", color: "#a78bfa", ...MONO }}>
              {s}
              <button onClick={() => set("skills", draft.skills.filter(x => x !== s))} style={{ background: "none", border: "none", color: "#7C71E8", cursor: "pointer", padding: "0", lineHeight: 1, fontSize: "14px" }}>×</button>
            </span>
          ))}
          <input
            ref={skillRef}
            style={{ flex: 1, minWidth: "120px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "13px", padding: "2px 0" }}
            placeholder="Type skill + Enter"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKey}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#a0a0b0", borderRadius: "7px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", ...MONO }}>
          Cancel
        </button>
        <button onClick={() => canSave && onSave(draft)} disabled={!canSave} style={{ background: canSave ? "#534AB7" : "#2a2a3a", border: "none", color: canSave ? "#fff" : "#555", borderRadius: "7px", padding: "8px 18px", fontSize: "13px", cursor: canSave ? "pointer" : "not-allowed", ...MONO, boxShadow: canSave ? "0 2px 12px rgba(83,74,183,0.3)" : "none" }}>
          Save internship
        </button>
      </div>
    </div>
  );
}

/* ─── Internship card ────────────────────────────────────────── */
function InternshipCard({ intern, onRemove }: { intern: Internship; onRemove: () => void }) {
  return (
    <div style={{ background: "#0d0d22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "9px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{intern.company}</span>
          <span style={{ color: "#7C71E8", fontSize: "13px" }}>·</span>
          <span style={{ color: "#a0a0b0", fontSize: "13px" }}>{intern.role}</span>
        </div>
        {intern.duration && (
          <div style={{ ...MONO, fontSize: "11px", color: "#4a4a6a", marginBottom: "6px" }}>{intern.duration}</div>
        )}
        {intern.projectDescription && (
          <p style={{ fontSize: "12px", color: "#6b6b8a", lineHeight: 1.6, marginBottom: "8px" }}>{intern.projectDescription}</p>
        )}
        {intern.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {intern.skills.map(s => (
              <span key={s} style={{ background: "rgba(83,74,183,0.15)", border: "1px solid rgba(83,74,183,0.3)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", color: "#7C71E8", ...MONO }}>{s}</span>
            ))}
          </div>
        )}
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", padding: "2px", borderRadius: "4px", transition: "color 0.15s", lineHeight: 1, flexShrink: 0 }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#f87171")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#3a3a5a")}
      >
        <X size={15} />
      </button>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function ProfileStep({ data, onChange, onNext, onBack }: ProfileStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [showInternForm, setShowInternForm] = useState(false);
  const [otherDomain, setOtherDomain] = useState("");

  /* helpers */
  const toggleDomain = (label: string) => {
    const cur = data.targetDomains;
    onChange("targetDomains", cur.includes(label) ? cur.filter(d => d !== label) : [...cur, label]);
  };

  const addInternship = (intern: Omit<Internship, "id">) => {
    const full: Internship = { ...intern, id: crypto.randomUUID() };
    onChange("internships", [...data.internships, full]);
    setShowInternForm(false);
  };

  const removeInternship = (id: string) => {
    onChange("internships", data.internships.filter(i => i.id !== id));
  };

  const handleContinue = () => {
    const errs: typeof errors = {};
    if (!data.fullName.trim()) errs.fullName = "Full name is required";
    if (!data.currentRole.trim()) errs.currentRole = "Current role is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext();
  };

  const field = (
    key: keyof ProfileFormData,
    label: string,
    placeholder: string,
    type = "text",
    half = false
  ) => (
    <div style={half ? {} : {}}>
      <label style={labelStyle}>{label}{["fullName","currentRole"].includes(key) && <span style={{ color: "#f87171" }}> *</span>}</label>
      <input
        type={type}
        style={errors[key] ? inputErrStyle : inputStyle}
        placeholder={placeholder}
        value={(data as any)[key] ?? ""}
        onChange={e => { onChange(key, e.target.value); if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; }); }}
        onFocus={e => { if (!errors[key]) e.target.style.borderColor = "#534AB7"; }}
        onBlur={e => { if (!errors[key]) e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />
      {errors[key] && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", ...MONO }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "inline-block", ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#7C71E8", background: "rgba(83,74,183,0.12)", border: "1px solid rgba(83,74,183,0.25)", padding: "4px 10px", borderRadius: "6px", marginBottom: "14px" }}>
          Step 3 of 7 — Profile
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.01em" }}>Tell us about yourself</h2>
        <p style={{ fontSize: "14px", color: "#a0a0b0", lineHeight: 1.6 }}>
          This helps our agents target the right roles. You can change this anytime.
        </p>
      </div>

      {/* Main card */}
      <div style={cardStyle}>

        {/* Row 1: Name + Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          {field("fullName", "Full name", "e.g. Sachin Kumar")}
          {field("email", "Email address", "you@example.com", "email")}
        </div>

        {/* Current role */}
        <div style={{ marginBottom: "20px" }}>
          {field("currentRole", "Current role", "e.g. Product Analyst, Software Engineer")}
        </div>

        {/* Domain tags */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Target domains</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {DOMAINS.map(d => {
              const active = data.targetDomains.includes(d.label);
              return (
                <button
                  key={d.label}
                  onClick={() => toggleDomain(d.label)}
                  style={{
                    padding: "6px 13px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: active ? d.bg : "transparent",
                    border: `1px solid ${active ? d.border : "rgba(255,255,255,0.1)"}`,
                    color: active ? d.color : "#6b6b8a",
                    ...MONO,
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {data.targetDomains.includes("Other") && (
            <input
              style={{ ...inputStyle, marginTop: "10px", maxWidth: "320px" }}
              placeholder="Specify your domain..."
              value={otherDomain}
              onChange={e => setOtherDomain(e.target.value)}
              onFocus={e => (e.target.style.borderColor = "#534AB7")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          )}
        </div>

        {/* Row: Target roles + Salary + Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "4px" }}>
          <div>
            <label style={labelStyle}>Target roles</label>
            <input style={inputStyle} placeholder="Business Analyst, Product Analyst" value={data.targetRoles ?? ""} onChange={e => onChange("targetRoles", e.target.value)} onFocus={e => (e.target.style.borderColor = "#534AB7")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
          </div>
          <div>
            <label style={labelStyle}>Min salary (LPA)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: "13px" }}>₹</span>
              <input type="number" style={{ ...inputStyle, paddingLeft: "26px" }} placeholder="e.g. 25" value={data.minSalaryLPA ?? ""} onChange={e => onChange("minSalaryLPA", e.target.value)} onFocus={e => (e.target.style.borderColor = "#534AB7")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location preference</label>
            <input style={inputStyle} placeholder="e.g. Bangalore, Remote" value={data.locationPreference ?? ""} onChange={e => onChange("locationPreference", e.target.value)} onFocus={e => (e.target.style.borderColor = "#534AB7")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
          </div>
        </div>
      </div>

      {/* ── Internship section ── */}
      <div style={{ ...cardStyle, marginTop: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>
                Internship & early career experience
                <span style={{ ...MONO, fontSize: "10px", color: "#4a4a6a", marginLeft: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "2px 6px" }}>optional</span>
              </div>
              <p style={{ fontSize: "12px", color: "#6b6b8a", lineHeight: 1.6 }}>
                Adding internships enriches your Pulse profile — especially useful if you're early in your career.
              </p>
            </div>
          </div>
        </div>

        {/* Internship list */}
        {data.internships.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {data.internships.map(i => (
              <InternshipCard key={i.id} intern={i} onRemove={() => removeInternship(i.id)} />
            ))}
          </div>
        )}

        {/* Add button / inline form */}
        {!showInternForm ? (
          <button
            onClick={() => setShowInternForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "transparent",
              border: "1px dashed rgba(83,74,183,0.4)",
              borderRadius: "8px",
              padding: "10px 16px",
              color: "#7C71E8",
              fontSize: "13px",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
              transition: "border-color 0.15s, background 0.15s",
              ...MONO,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(83,74,183,0.07)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(83,74,183,0.7)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(83,74,183,0.4)"; }}
          >
            <Plus size={14} /> Add internship
          </button>
        ) : (
          <InternshipForm onSave={addInternship} onCancel={() => setShowInternForm(false)} />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: "none", color: "#6b6b8a", fontSize: "13px", cursor: "pointer", padding: "8px 4px", ...MONO }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#fff")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#6b6b8a")}
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          style={{ background: "#534AB7", border: "none", color: "#fff", borderRadius: "8px", padding: "11px 28px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 18px rgba(83,74,183,0.35)", transition: "background 0.15s, box-shadow 0.15s", ...MONO }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#6358c7"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 26px rgba(83,74,183,0.5)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#534AB7"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 18px rgba(83,74,183,0.35)"; }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
