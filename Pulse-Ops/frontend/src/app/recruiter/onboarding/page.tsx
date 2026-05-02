"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Briefcase,
  User,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const STEPS = [
  {
    id: 1,
    label: "Company",
    sublabel: "Tell us about your org",
    icon: Building2,
  },
  {
    id: 2,
    label: "Role",
    sublabel: "Define the position",
    icon: Briefcase,
  },
  {
    id: 3,
    label: "You",
    sublabel: "Your recruiter profile",
    icon: User,
  },
  {
    id: 4,
    label: "Activate",
    sublabel: "Launch matching engine",
    icon: Zap,
  },
];

const SYNC_LOGS = [
  "Connecting to Pulse-Ops matching engine...",
  "Loading verified candidate database...",
  "Indexing skill confidence vectors...",
  "Calibrating role requirement matrix...",
  "Scoring 2,847 active candidates...",
  "Applying experience filters...",
  "Running domain relevance ranking...",
  "Computing final match scores...",
  "Top 127 candidates identified...",
  "Configuring real-time alert pipeline...",
  "Matching engine armed. Ready to hire. ✓",
];

interface CompanyData {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
}

interface RoleData {
  jobTitle: string;
  requiredSkills: string[];
  experienceLevel: string;
  salaryRange: string;
  locationModel: string;
  jobDescription: string;
}

interface YouData {
  recruiterName: string;
  recruiterTitle: string;
  notifEmail: string;
}

export default function RecruiterOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Company
  const [company, setCompany] = useState<CompanyData>({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
  });

  // Step 2: Role
  const [role, setRole] = useState<RoleData>({
    jobTitle: "",
    requiredSkills: [],
    experienceLevel: "",
    salaryRange: "",
    locationModel: "",
    jobDescription: "",
  });
  const [skillInput, setSkillInput] = useState("");

  // Step 3: You
  const [you, setYou] = useState<YouData>({
    recruiterName: "",
    recruiterTitle: "",
    notifEmail: "",
  });

  // Step 4: Activation animation
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const [activationDone, setActivationDone] = useState(false);
  const activationStarted = useRef(false);

  // Pre-fill email from supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setYou((prev) => ({ ...prev, notifEmail: data.user.email! }));
      }
    });
  }, []);

  // Run animation when step 4 is entered
  useEffect(() => {
    if (step === 4 && !activationStarted.current) {
      activationStarted.current = true;
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setVisibleLogs(idx);
        if (idx >= SYNC_LOGS.length) {
          clearInterval(interval);
          setTimeout(() => setActivationDone(true), 300);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!company.companyName.trim()) newErrors.companyName = "Company name is required.";
      if (!company.industry) newErrors.industry = "Please select an industry.";
      if (!company.companySize) newErrors.companySize = "Please select a company size.";
    }
    if (step === 2) {
      if (!role.jobTitle.trim()) newErrors.jobTitle = "Job title is required.";
      if (role.requiredSkills.length === 0) newErrors.requiredSkills = "Add at least one required skill.";
      if (!role.experienceLevel) newErrors.experienceLevel = "Please select an experience level.";
      if (!role.salaryRange.trim()) newErrors.salaryRange = "Salary range is required.";
      if (!role.locationModel) newErrors.locationModel = "Please select a location model.";
    }
    if (step === 3) {
      if (!you.recruiterName.trim()) newErrors.recruiterName = "Your name is required.";
      if (!you.recruiterTitle.trim()) newErrors.recruiterTitle = "Your title is required.";
      if (!you.notifEmail.trim()) newErrors.notifEmail = "Notification email is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (!role.requiredSkills.includes(trimmed)) {
        setRole((r) => ({ ...r, requiredSkills: [...r.requiredSkills, trimmed] }));
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setRole((r) => ({ ...r, requiredSkills: r.requiredSkills.filter((s) => s !== skill) }));
  };

  const handleEnterDashboard = async () => {
    const localProfile = {
      name: you.recruiterName,
      title: you.recruiterTitle,
      email: you.notifEmail,
      companyName: company.companyName,
      companyIndustry: company.industry,
      companySize: company.companySize,
      companyWebsite: company.website,
    };
    const localRoles = [
      {
        id: crypto.randomUUID(),
        title: role.jobTitle,
        skills: role.requiredSkills,
        experience: role.experienceLevel,
        salary: role.salaryRange,
        locationModel: role.locationModel,
        description: role.jobDescription,
        industry: company.industry,
        status: "active",
        candidateCount: 127,
        shortlisted: 0,
        unlocked: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    // Persist to localStorage (cache)
    localStorage.setItem("recruiter_profile", JSON.stringify(localProfile));
    localStorage.setItem("recruiter_roles", JSON.stringify(localRoles));
    localStorage.setItem("recruiter_onboarded", "true");

    // Persist to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("recruiter_profiles").upsert({
          user_id: user.id,
          name: you.recruiterName,
          title: you.recruiterTitle,
          email: you.notifEmail,
          company_name: company.companyName,
          company_industry: company.industry,
          company_size: company.companySize,
          company_website: company.website,
          onboarding_completed: true,
        }, { onConflict: "user_id" });

        await supabase.from("recruiter_roles").insert({
          user_id: user.id,
          title: role.jobTitle,
          domain: company.industry,
          skills: role.requiredSkills,
          description: role.jobDescription,
          salary_range: role.salaryRange,
          location_model: role.locationModel,
          experience_level: role.experienceLevel,
          is_active: true,
        });

        // mark role in public.users
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email,
          role: "recruiter",
        }, { onConflict: "id" });
      }
    } catch (err) {
      console.warn("Supabase save error:", err);
    }

    router.push("/recruiter/dashboard");
  };

  const stepTitles: Record<number, { title: string; description: string }> = {
    1: {
      title: "Tell us about your company",
      description: "We use this to tailor candidate matching to your domain and scale.",
    },
    2: {
      title: "Define the role you're hiring for",
      description: "The Pulse-Ops engine will score every candidate against these exact requirements.",
    },
    3: {
      title: "Set up your recruiter profile",
      description: "Your profile is shown to shortlisted candidates when contact is unlocked.",
    },
    4: {
      title: "Activating your matching engine",
      description: "Sit tight — we're initializing your personalized talent pipeline.",
    },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-72 shrink-0 bg-[#0f172a] flex flex-col py-10 px-8">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            PulseHire<span className="text-blue-500">.</span>
          </span>
        </div>

        <div className="space-y-2 flex-1">
          {STEPS.map((s) => {
            const isDone = step > s.id;
            const isActive = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-start gap-3 py-3">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {s.id}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {s.id}
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      isActive
                        ? "text-white"
                        : isDone
                        ? "text-blue-400"
                        : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isActive ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {s.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 mt-8">Powered by Pulse-Ops Engine</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-10">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Step header */}
          <div className="mb-8">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              Step {step} of 4
            </p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {stepTitles[step].title}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {stepTitles[step].description}
            </p>
          </div>

          {/* Step 1: Company */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Acme Corp"
                  className="border-slate-300 h-11"
                  value={company.companyName}
                  onChange={(e) =>
                    setCompany((c) => ({ ...c, companyName: e.target.value }))
                  }
                />
                {errors.companyName && (
                  <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Industry <span className="text-red-500">*</span>
                </label>
                <Select
                  value={company.industry}
                  onValueChange={(v) =>
                    setCompany((c) => ({ ...c, industry: v }))
                  }
                >
                  <SelectTrigger className="border-slate-300 h-11">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FinTech">FinTech</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="HealthTech">HealthTech</SelectItem>
                    <SelectItem value="Dev Tools">Dev Tools</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-xs text-red-500 mt-1">{errors.industry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company Size <span className="text-red-500">*</span>
                </label>
                <Select
                  value={company.companySize}
                  onValueChange={(v) =>
                    setCompany((c) => ({ ...c, companySize: v }))
                  }
                >
                  <SelectTrigger className="border-slate-300 h-11">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-1000">201–1,000</SelectItem>
                    <SelectItem value="1000+">1,000+</SelectItem>
                  </SelectContent>
                </Select>
                {errors.companySize && (
                  <p className="text-xs text-red-500 mt-1">{errors.companySize}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Website{" "}
                  <span className="text-slate-400 font-normal text-xs">(optional)</span>
                </label>
                <Input
                  placeholder="https://yourcompany.com"
                  className="border-slate-300 h-11"
                  value={company.website}
                  onChange={(e) =>
                    setCompany((c) => ({ ...c, website: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Backend Engineer"
                  className="border-slate-300 h-11"
                  value={role.jobTitle}
                  onChange={(e) =>
                    setRole((r) => ({ ...r, jobTitle: e.target.value }))
                  }
                />
                {errors.jobTitle && (
                  <p className="text-xs text-red-500 mt-1">{errors.jobTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Required Skills <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Press Enter to add a skill tag.
                </p>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50 min-h-[48px] mb-2">
                  {role.requiredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-white text-blue-700 border border-blue-200 px-2.5 py-1 flex items-center gap-1 text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a skill and press Enter..."
                  className="border-slate-300 h-10"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                {errors.requiredSkills && (
                  <p className="text-xs text-red-500 mt-1">{errors.requiredSkills}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Experience Level <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={role.experienceLevel}
                    onValueChange={(v) =>
                      setRole((r) => ({ ...r, experienceLevel: v }))
                    }
                  >
                    <SelectTrigger className="border-slate-300 h-11">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2 yrs">0–2 yrs</SelectItem>
                      <SelectItem value="2-5 yrs">2–5 yrs</SelectItem>
                      <SelectItem value="5-10 yrs">5–10 yrs</SelectItem>
                      <SelectItem value="10+ yrs">10+ yrs</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.experienceLevel && (
                    <p className="text-xs text-red-500 mt-1">{errors.experienceLevel}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Location Model <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={role.locationModel}
                    onValueChange={(v) =>
                      setRole((r) => ({ ...r, locationModel: v }))
                    }
                  >
                    <SelectTrigger className="border-slate-300 h-11">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="On-site">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.locationModel && (
                    <p className="text-xs text-red-500 mt-1">{errors.locationModel}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 inline mr-0.5 text-slate-500" />
                  Salary Range <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. $120,000 – $160,000"
                  className="border-slate-300 h-11"
                  value={role.salaryRange}
                  onChange={(e) =>
                    setRole((r) => ({ ...r, salaryRange: e.target.value }))
                  }
                />
                {errors.salaryRange && (
                  <p className="text-xs text-red-500 mt-1">{errors.salaryRange}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Job Description{" "}
                  <span className="text-slate-400 font-normal text-xs">(optional)</span>
                </label>
                <Textarea
                  placeholder="Paste or type the job description for better context matching..."
                  className="border-slate-300 min-h-[100px] resize-y"
                  value={role.jobDescription}
                  onChange={(e) =>
                    setRole((r) => ({ ...r, jobDescription: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* Step 3: You */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Jordan Smith"
                  className="border-slate-300 h-11"
                  value={you.recruiterName}
                  onChange={(e) =>
                    setYou((y) => ({ ...y, recruiterName: e.target.value }))
                  }
                />
                {errors.recruiterName && (
                  <p className="text-xs text-red-500 mt-1">{errors.recruiterName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Title <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Head of Engineering Talent"
                  className="border-slate-300 h-11"
                  value={you.recruiterTitle}
                  onChange={(e) =>
                    setYou((y) => ({ ...y, recruiterTitle: e.target.value }))
                  }
                />
                {errors.recruiterTitle && (
                  <p className="text-xs text-red-500 mt-1">{errors.recruiterTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Notification Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="recruiter@company.com"
                  className="border-slate-300 h-11"
                  value={you.notifEmail}
                  onChange={(e) =>
                    setYou((y) => ({ ...y, notifEmail: e.target.value }))
                  }
                />
                {errors.notifEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.notifEmail}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  You&apos;ll receive alerts when new top-match candidates are found.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Activation terminal */}
          {step === 4 && (
            <div>
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 font-mono text-sm min-h-[280px]">
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                  <span className="ml-2 text-slate-500 text-xs">pulse-ops ~ matching-engine</span>
                </div>
                <div className="space-y-1.5">
                  {SYNC_LOGS.slice(0, visibleLogs).map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0">$</span>
                      <span
                        className={
                          log.includes("✓")
                            ? "text-green-400 font-semibold"
                            : "text-green-300"
                        }
                      >
                        {log}
                      </span>
                    </div>
                  ))}
                  {visibleLogs < SYNC_LOGS.length && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-blue-400">$</span>
                      <span className="w-2 h-4 bg-green-400 animate-pulse rounded-sm ml-1" />
                    </div>
                  )}
                </div>
              </div>

              {activationDone && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500 mb-4">
                    Your pipeline is live. 127 candidates are waiting.
                  </p>
                  <Button
                    onClick={handleEnterDashboard}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-11 shadow-lg shadow-blue-600/20"
                  >
                    Enter Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-10 shadow-md shadow-blue-600/20"
              >
                {step === 3 ? "Activate Engine" : "Next"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}

          {step === 4 && !activationDone && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Initializing your personalized matching engine…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
