import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup — Pulse-Ops",
  description: "Activate your Pulse-Ops agent and sync your technical presence.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
