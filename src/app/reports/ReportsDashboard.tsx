// src/app/reports/ReportsDashboard.tsx
// Main analytics dashboard for the Reports page
import React from "react";
import { AnalyticsChart } from "@/components/reports/AnalyticsChart";
import { SummaryMetricCard } from "@/components/reports/SummaryMetricCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card } from "@/components/ui/card";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Users } from "lucide-react";

interface ReportsDashboardProps {
  okrs: any[];
}

// Utility to aggregate OKR stats
function getOkrStats(okrs: any[]) {
  const total = okrs.length;
  const completed = okrs.filter(o => o.status === "completed").length;
  const active = okrs.filter(o => o.status === "on_track" || o.status === "active").length;
  const atRisk = okrs.filter(o => o.status === "at_risk").length;
  const offTrack = okrs.filter(o => o.status === "off_track").length;
  const archived = okrs.filter(o => o.status === "archived").length;
  const deleted = okrs.filter(o => o.status === "deleted").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, active, atRisk, offTrack, archived, deleted, completionRate };
}

// Pie chart data for status breakdown
function getStatusPieData(okrs: any[]) {
  const statuses = [
    { key: "completed", label: "Completed" },
    { key: "on_track", label: "On Track" },
    { key: "at_risk", label: "At Risk" },
    { key: "off_track", label: "Off Track" },
    { key: "archived", label: "Archived" },
    { key: "deleted", label: "Deleted" },
  ];
  return statuses.map(s => ({
    name: s.label,
    value: okrs.filter(o => o.status === s.key).length,
  })).filter(d => d.value > 0);
}

// Bar chart data: completions by month (MVP: by createdAt)
function getCompletionsByMonth(okrs: any[]) {
  const byMonth: { [k: string]: number } = {};
  okrs.forEach(o => {
    if (o.status === "completed" && o.endDate) {
      const month = new Date(o.endDate).toLocaleString("default", { month: "short", year: "2-digit" });
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });
  // Convert to array and sort chronologically (month/year)
  return Object.entries(byMonth)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      // Parse e.g. 'Apr 25' as 1 Apr 2025
      const parse = (s: string) => {
        const [monthStr, yearStr] = s.split(' ');
        // Use 1st of month
        return new Date(`${monthStr} 1 20${yearStr}`);
      };
      return parse(a.name).getTime() - parse(b.name).getTime();
    });
}

import { DateRangePicker } from "@/components/ui/DateRangePicker";

import { useRouter } from 'next/navigation';

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ okrs }) => {
  const router = useRouter();
  const stats = getOkrStats(okrs);
  const statusPieData = Array.isArray(getStatusPieData(okrs)) ? getStatusPieData(okrs) : [];
  const completionsByMonth = Array.isArray(getCompletionsByMonth(okrs)) ? getCompletionsByMonth(okrs) : [];

  // Find min and max months in completionsByMonth
  const allMonths = completionsByMonth.map(d => d.name);
  const parse = (s: string) => {
    const [monthStr, yearStr] = s.split(' ');
    return new Date(`${monthStr} 1 20${yearStr}`);
  };
  const minMonth = allMonths.length ? allMonths.reduce((a, b) => parse(a) < parse(b) ? a : b) : null;
  const maxMonth = allMonths.length ? allMonths.reduce((a, b) => parse(a) > parse(b) ? a : b) : null;
  // Default to current year if data exists for it; otherwise use min/max
  const currentYear = new Date().getFullYear();
  const monthsInCurrentYear = completionsByMonth.filter(d => parse(d.name).getFullYear() === currentYear);
  const jan = `${currentYear}-01`;
  const dec = `${currentYear}-12`;
  const [range, setRange] = React.useState<{ start: string | null; end: string | null }>(() => {
    if (monthsInCurrentYear.length > 0) {
      // Use first and last available month in current year for better UX
      const sorted = monthsInCurrentYear.map(d => parse(d.name)).sort((a, b) => a.getTime() - b.getTime());
      const firstMonth = sorted[0];
      const lastMonth = sorted[sorted.length - 1];
      return {
        start: `${firstMonth.getFullYear()}-${String(firstMonth.getMonth() + 1).padStart(2, '0')}`,
        end: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
      };
    }
    return {
      start: minMonth ? `${parse(minMonth).getFullYear()}-${String(parse(minMonth).getMonth() + 1).padStart(2, '0')}` : null,
      end: maxMonth ? `${parse(maxMonth).getFullYear()}-${String(parse(maxMonth).getMonth() + 1).padStart(2, '0')}` : null,
    };
  });

  // Filter completionsByMonth by selected range
  const filteredCompletions = completionsByMonth.filter(d => {
    if (!range.start && !range.end) return true;
    const dDate = parse(d.name);
    const startDate = range.start ? new Date(`${range.start}-01`) : null;
    const endDate = range.end ? new Date(`${range.end}-01`) : null;
    if (startDate && dDate < startDate) return false;
    if (endDate && dDate > new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-10 md:gap-12 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl px-4 md:px-10 py-8 md:py-12 border border-slate-100 select-none">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Total OKRs"
          value={stats.total}
          icon={<BarChart3 />}
          className="transition-shadow duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 rounded-2xl"
          onClick={() => router.push('/okrs')}
          role="button"
          tabIndex={0}
        />
        <SummaryMetricCard
          title="Completed"
          value={stats.completed}
          icon={<TrendingUp />}
          colorClass="text-green-600"
          className="transition-shadow duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 rounded-2xl"
          onClick={() => router.push('/okrs?status=completed')}
          role="button"
          tabIndex={0}
        />
        <SummaryMetricCard
          title="Active"
          value={stats.active}
          icon={<Users />}
          colorClass="text-blue-600"
          className="transition-shadow duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 rounded-2xl"
          onClick={() => router.push('/okrs?status=active')}
          role="button"
          tabIndex={0}
        />
        <SummaryMetricCard
          title="At Risk"
          value={stats.atRisk}
          icon={<PieChartIcon />}
          colorClass="text-orange-500"
          className="transition-shadow duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 rounded-2xl"
          onClick={() => router.push('/okrs?status=at_risk')}
          role="button"
          tabIndex={0}
        />
      </div>
      <div className="my-2 border-t border-slate-200" />
      {/* Completion Rate Progress */}
      <div className="flex flex-row gap-6 items-center justify-center">
        <Card className="flex flex-col items-center justify-center p-8 min-w-[200px] bg-white/80 shadow-lg rounded-2xl border border-slate-100 transition-shadow duration-200 cursor-default">
          <div className="mb-2 font-medium text-gray-600">Completion Rate</div>
          <ProgressRing progress={stats.completionRate} size={80} color="#22c55e" label="Completion Rate" />
          <div className="mt-2 text-lg font-bold text-green-600">{stats.completionRate}%</div>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/90 rounded-2xl shadow border border-slate-100 p-4 md:p-6 flex flex-col cursor-pointer hover:shadow-xl transition-shadow duration-200">
          <AnalyticsChart
            type="pie"
            data={statusPieData}
            dataKey="value"
            nameKey="name"
            title="OKR Status Breakdown"
          />
        </div>
        <div className="bg-white/90 rounded-2xl shadow border border-slate-100 p-4 md:p-6 flex flex-col gap-2 cursor-pointer hover:shadow-xl transition-shadow duration-200">
          <div className="flex justify-end mb-2 cursor-pointer">
            <DateRangePicker
              value={range}
              onChange={setRange}
              min={minMonth ? `${parse(minMonth).getFullYear()}-${String(parse(minMonth).getMonth() + 1).padStart(2, '0')}` : undefined}
              max={maxMonth ? `${parse(maxMonth).getFullYear()}-${String(parse(maxMonth).getMonth() + 1).padStart(2, '0')}` : undefined}
              className="transition-shadow duration-200 focus-within:ring-2 focus-within:ring-blue-400 rounded-lg cursor-pointer hover:ring hover:ring-blue-200"
            />
          </div>
          <AnalyticsChart
            type="bar"
            data={filteredCompletions}
            dataKey="value"
            xKey="name"
            yKey="value"
            title="Completions by Month"
          />
        </div>
      </div>
    </div>
  );
};
