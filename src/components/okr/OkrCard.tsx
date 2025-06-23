// OkrCard.tsx
// Best Practices: Modular, reusable, accessible, design prompt reference
// Best_Practices.md: Accessibility, modularity, robust UI feedback, design prompt reference
// Design_Prompts/2.txt: Color palette, spacing, typography, badge style
// DEVELOPMENT_TIMELINE.md: Log UI/UX polish for OKR cards

// Best_Practices.md: Accessibility, modularity, robust UI feedback, design prompt reference
// Design_Prompts/2.txt: Color palette, spacing, typography, badge style
// DEVELOPMENT_TIMELINE.md: Log UI/UX polish for OKR cards

import React from "react";
import { Card } from "../ui/card";
import { ProgressRing } from "../ui/ProgressRing";
import Avatar from "../ui/avatar";
import { OkrCardMenu } from "./OkrCardMenu";

interface KeyResultCard {
  title: string;
  type: "percent" | "target";
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
  // Support both legacy single owner and new multiple owners array
  owner?: string;
  ownerAvatarUrl?: string;
  // New owners array format
  owners?: Array<{ _id: string; name?: string; avatarUrl?: string }>;
  description?: string;
  goalType?: string;
  createdBy?: string;
  createdByAvatarUrl?: string;
  createdByInitials?: string;
}

// Status pill color mapping
const statusPill: Record<string, string> = {
  "On Track": "bg-blue-100 text-blue-700 border-blue-200",
  "on_track": "bg-blue-100 text-blue-700 border-blue-200",
  "Off Track": "bg-orange-100 text-orange-700 border-orange-200",
  "off_track": "bg-orange-100 text-orange-700 border-orange-200",
  "At Risk": "bg-red-100 text-red-700 border-red-200",
  "at_risk": "bg-red-100 text-red-700 border-red-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
  "completed": "bg-green-100 text-green-700 border-green-200",
  "active": "bg-blue-100 text-blue-700 border-blue-200",
  "archived": "bg-gray-100 text-gray-600 border-gray-200",
  "on_hold": "bg-orange-100 text-orange-700 border-orange-200",
  "cancelled": "bg-red-100 text-red-700 border-red-200",
};

export const OkrCard: React.FC<OkrCardProps> = ({
  objective,
  dueDate,
  status,
  keyResults,
  lastUpdated,
  owner,
  ownerAvatarUrl,
  owners = [], // Initialize empty array for new format
  description,
  goalType,
  createdBy,
  createdByAvatarUrl,
  createdByInitials,
}) => {
  console.log('[OkrCard] props:', { createdBy, createdByAvatarUrl, createdByInitials });
  // Calculate average percent progress for ring
  const percentKRs = (keyResults || []).filter(kr => kr.type === "percent" && typeof kr.progress === "number");
  const avgProgress = percentKRs.length > 0 ? Math.round(percentKRs.reduce((sum, kr) => sum + (kr.progress ?? 0), 0) / percentKRs.length) : 0;

  return (
    <Card
      className="flex flex-row items-stretch gap-4 p-4 md:p-6 bg-white rounded-2xl shadow border border-gray-200 focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer hover:shadow-lg transition-shadow min-h-[112px]"
      tabIndex={0}
      aria-label={`OKR: ${objective}`}
      role="article"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Progress ring left visual */}
      <div className="flex items-center justify-center min-w-[56px] max-w-[56px] mr-2 md:mr-4">
        <ProgressRing progress={avgProgress} size={48} color="#0071E1" bgColor="#FAFAFB" label="Progress" />
      </div>
      {/* Main card content */}
      <div className="flex-1 flex flex-col min-w-0 justify-center">
        <h2 className="text-xl md:text-2xl font-bold text-[#000C2C] leading-tight mb-1 truncate" title={objective} style={{lineHeight:'1.2'}}>{objective}</h2>
        <div className="text-[#B3BCC5] text-base md:text-lg mb-2 truncate" aria-label="Objective description">{description || "No description provided."}</div>
        <div className="flex flex-row items-center justify-between gap-y-2 text-xs md:text-sm text-[#B3BCC5] mt-1" role="contentinfo" aria-label="OKR details">
          {/* Left: Owners, Created by, Goal type */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {/* Owners - Support multiple owners with avatar stack */}
                {(owner || owners.length > 0) && (
                  <span className="flex items-center gap-1">
                    <span className="text-[#B3BCC5] mr-1">Owners:</span>
                    <div className="flex -space-x-3 overflow-visible group">
                      {/* Show legacy single owner if present */}
                      {owner && !owners.length && (
                        <Avatar 
                          src={ownerAvatarUrl} 
                          username={owner} 
                          alt={owner + " avatar"} 
                          size="sm" 
                          className="ring-2 ring-white border border-gray-200 shadow-sm transition-transform hover:z-10 hover:scale-110"
                        />
                      )}
                      
                      {/* Show multiple owners (up to 3) with overflow indicator */}
                      {owners.length > 0 && (
                        <>
                          {owners.slice(0, 3).map((ownerItem, index) => (
                            <Avatar 
                              key={ownerItem._id || index} 
                              src={ownerItem.avatarUrl} 
                              username={ownerItem.name || `Owner ${index + 1}`} 
                              alt={(ownerItem.name || `Owner ${index + 1}`) + " avatar"} 
                              size="sm" 
                              className={`ring-2 ring-white border border-gray-200 shadow-sm transition-transform hover:z-10 hover:scale-110 ${index > 0 ? 'hover:-translate-x-1' : ''}`}
                              // Add title attribute for accessibility
                              title={ownerItem.name || `Owner ${index + 1}`}
                            />
                          ))}
                          {/* Show count badge for more than 3 owners */}
                          {owners.length > 3 && (
                            <span 
                              className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-400 rounded-full ring-2 ring-white shadow-sm hover:bg-gray-500 transition-colors cursor-help"
                              title={`${owners.length - 3} more owners`}
                              aria-label={`${owners.length - 3} more owners`}
                            >
                              +{owners.length - 3}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </span>
                )}
            {/* Created by */}
            {createdBy && (
  <span className="flex items-center gap-1 ml-2 md:ml-3">
    <span className="text-[#B3BCC5] mr-1">Created by:</span>
    <Avatar
      src={createdByAvatarUrl}
      username={createdBy}
      alt={createdBy}
      size="sm"
      className="ring-2 ring-white border border-gray-200 shadow-sm transition-transform hover:z-10 hover:scale-110"
    />
  </span>
)}
            {/* Goal type badge */}
            {goalType && (
              <span className="inline-block bg-[#FAFAFB] text-[#000C2C] px-2 py-0.5 rounded-full text-[11px] font-medium border border-[#B3BCC5] ml-2" aria-label={`Goal type: ${goalType}`}>{goalType === "team" ? "Team Goal" : goalType === "individual" ? "Individual Goal" : goalType}</span>
            )}
          </div>
          {/* Right: Due date & Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-block bg-[#FAFAFB] text-[#0071E1] px-2 py-0.5 rounded-full font-medium border border-[#B3BCC5]" aria-label={`Due date: ${dueDate}`}>Due: {dueDate}</span>
            <span className={`inline-block px-2 py-0.5 rounded-full font-semibold border text-xs capitalize ${statusPill[status] || "bg-gray-100 text-gray-600 border-gray-200"}`} aria-label={`Status: ${status}`}>{
              status === 'on_track' ? 'On Track' :
              status === 'at_risk' ? 'At Risk' :
              status === 'off_track' ? 'Off Track' :
              status === 'completed' ? 'Completed' :
              status.charAt(0).toUpperCase() + status.slice(1)
            }</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

