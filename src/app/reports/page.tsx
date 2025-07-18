'use client';
// Reports Page - Scaffolded from OKRs and Dashboard for maximum reuse
// Best_Practices.md: Modular, accessible, DRY, no breaking changes

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReportsDashboard } from "./ReportsDashboard";
import { Skeleton } from "../../components/ui/skeleton";

interface Okr {
  _id: string;
  objective: string;
  description?: string;
  keyResults: any[];
  owners?: any[];
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  department?: string;
  dueDate?: string;
  lastUpdated?: string;
  owner?: string;
  ownerAvatarUrl?: string;
  goalType?: string;
  createdBy?: string;
  createdByAvatarUrl?: string;
  createdByInitials?: string;
  slug?: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    setLoading(true);
    fetch("/api/okrs")
      .then((res) => res.json())
      .then((data) => {
        setOkrs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load OKRs");
        setLoading(false);
      });
  }, [status, session]);

  if (loading) {
    return <Skeleton className="h-96 w-full mt-8" />;
  }
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      <ReportsDashboard okrs={okrs} />
    </main>
  );
}
