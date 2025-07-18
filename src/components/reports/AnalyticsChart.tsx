// src/components/reports/AnalyticsChart.tsx
// A dynamic, reusable chart component for analytics dashboards
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export type ChartType = "pie" | "bar" | "line";

interface AnalyticsChartProps {
  type: ChartType;
  data: any[];
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  title?: string;
  height?: number;
  // For bar/line
  xKey?: string;
  yKey?: string;
}

const COLORS = [
  "#2563eb", // blue-600
  "#22c55e", // green-500
  "#f59e42", // amber-500
  "#ef4444", // red-500
  "#a855f7", // purple-500
  "#14b8a6", // teal-500
  "#eab308", // yellow-500
  "#64748b", // slate-500
];

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  dataKey,
  nameKey = "name",
  colors = COLORS,
  title,
  height = 260,
  xKey,
  yKey,
}) => {
  // Defensive: always use array for data
  const safeData = Array.isArray(data) ? data : [];
  if (!type || !dataKey) {
    return <div className="text-red-500 py-8">Chart misconfigured: missing required props.</div>;
  }
  if (!safeData || safeData.length === 0) {
    return <div className="text-center text-gray-400 py-8">No data to display</div>;
  }
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-400 py-8">No data to display</div>;
  }

  return (
    <div className="w-full h-full">
      {title && <div className="font-semibold mb-2 text-center">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        {type === "pie" ? (
          <PieChart>
            <Pie
              data={safeData}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              cursor="pointer"
              className="analytics-chart-interactive"
              aria-label="Pie chart segment"
              role="list"
            >
              {safeData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : type === "bar" && xKey && yKey ? (
          <BarChart data={safeData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend formatter={() => "Number of Completed Okrs"} wrapperStyle={{ cursor: 'pointer' }} />
            <Bar dataKey={yKey} fill={colors[0]} cursor="pointer" className="analytics-chart-interactive" aria-label="Bar chart bar" role="listitem" />
          </BarChart>
        ) : type === "line" && xKey && yKey ? (
          <LineChart data={safeData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke={colors[0]} strokeWidth={2} dot className="analytics-chart-interactive" cursor="pointer" aria-label="Line chart line" role="listitem" />
          </LineChart>
        ) : (
          <div className="text-center text-gray-400 py-8">No valid chart type or missing keys</div>
        )}
      </ResponsiveContainer>
    </div>
  );
};
