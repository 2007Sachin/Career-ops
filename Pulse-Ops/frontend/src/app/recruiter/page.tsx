"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecruiterEntryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?role=recruiter");
  }, [router]);
  return null;
}
