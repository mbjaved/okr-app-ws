// OkrCard.tsx
// Best Practices: Modular, reusable, accessible, design prompt reference
import React from "react";
import { Card } from "../ui/card";

interface KeyResultCard {
  title: string;
  type: 'percent' | 'target';
  progress?: number;
  current?: number;
  target?: number;
  unit?: string;
}

interface OkrCardProps {
  objective: string;
  dueDate: string;
  status: string;
  keyResults: KeyResultCard[];
  lastUpdated: string;
} // keyResultCount removed, not needed

export const OkrCard: React.FC<OkrCardProps> = ({
  objective,
  dueDate,
  status,
  keyResults,
  lastUpdated,
}) => {
  // Status color mapping based on design prompt
  const statusColors: Record<string, string> = {
    "On Track": "#B3BCC5",
    "Off Track": "#FF7600",
    "At Risk": "#FF2538",
    "Completed": "#53BA00",
  };
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{objective}</h2>
        <div className="flex items-center mb-2">
          <span className="text-sm text-gray-500 mr-2">Due: {dueDate}</span>
          <span
            className={
              `inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ` +
              (status === "active"
                ? "bg-blue-100 text-blue-700"
                : status === "completed"
                ? "bg-green-100 text-green-700"
                : status === "archived"
                ? "bg-gray-200 text-gray-700"
                : status === "on_hold"
                ? "bg-yellow-100 text-yellow-800"
                : status === "cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700")
            }
          >
            {status}
          </span>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          {(Array.isArray(keyResults) ? keyResults : []).map((kr, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-medium text-xs text-gray-700">{kr.title}</span>
              {kr.type === 'percent' && (
                <>
                  <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                      style={{ width: `${kr.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-1">{kr.progress ?? 0}%</span>
                </>
              )}
              {kr.type === 'target' && (
                <span className="text-xs text-gray-500 ml-1">
                  {kr.current ?? 0} / {kr.target ?? 0} {kr.unit}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{(Array.isArray(keyResults) ? keyResults.length : 0)} Key Results</span>
          <span className="text-xs text-gray-400">Last updated: {lastUpdated}</span>
        </div>
      </div>
    </Card>
  );
};
