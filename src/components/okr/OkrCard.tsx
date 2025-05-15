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

// Step 2: Refine card layout per Design_Prompts and Best_Practices.md
interface OkrCardProps {
  objective: string;
  dueDate: string;
  status: string;
  keyResults: KeyResultCard[];
  lastUpdated: string;
  owner?: string; // Optional owner name or username
} // keyResultCount removed, not needed

export const OkrCard: React.FC<OkrCardProps> = ({
  objective,
  dueDate,
  status,
  keyResults,
  lastUpdated,
  owner,
}) => {
  // Status color mapping based on design prompt
  // Step 2: Use correct status tag color mapping from design prompt
  const statusColors: Record<string, string> = {
    "On Track": "#B3BCC5",
    "Off Track": "#FF7600",
    "At Risk": "#FF2538",
    "Completed": "#53BA00",
    // fallback for legacy values
    "active": "#0071E1",
    "archived": "#B3BCC5",
    "completed": "#53BA00",
    "on_hold": "#FF7600",
    "cancelled": "#FF2538",
  };
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{objective}</h2>
        {/* Status tag per design prompt */}
        <div className="flex items-center mb-2">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: statusColors[status] || '#B3BCC5', color: '#fff' }}
            aria-label={`Status: ${status}`}
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
        {/* Step 2: Subtext row per design prompt, accessible and with dividers */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500" role="contentinfo" aria-label="OKR details">
          <div className="flex items-center gap-2 w-full">
            {owner && (
              <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid cursor-pointer transition-all" tabIndex={0} aria-label={`Owner: ${owner}`}>{owner}</span>
            )}
            {owner && <span className="mx-2 text-gray-300 select-none" aria-hidden="true">|</span>}
            <span>Due: {dueDate}</span>
            <span className="mx-2 text-gray-300 select-none" aria-hidden="true">|</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
