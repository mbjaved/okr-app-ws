import { ObjectId } from "mongodb";

// Possible status values for OKRs
export type OKRStatus =
  | "active"
  | "completed"
  | "archived"
  | "on_hold"
  | "cancelled";

// Progress type for Key Results
export type ProgressType = "percentage" | "custom";

// Key Result Schema
export interface KeyResult {
  krId: ObjectId;
  title: string;
  progress: {
    type: ProgressType;
    value: number;        // Percentage or custom value (e.g., 4)
    target: number;       // 100 for percent, or custom target (e.g., 10)
    customLabel?: string; // (Optional) e.g., "team members completed"
  };
  assignedTo?: ObjectId[]; // (Optional) User IDs assigned to this KR
  notes?: string;
}

// OKR Schema
export interface OKR {
  _id?: ObjectId;
  userId: ObjectId;         // Creator of the OKR
  objective: string;
  description?: string;
  keyResults: KeyResult[];
  category: "Individual" | "Team";
  owners: string[]; // User IDs assigned to this OKR (at least one)
  status: OKRStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Utility function to create a new OKR (with sensible defaults)
export function createOKR(params: {
  userId: ObjectId;
  objective: string;
  keyResults: KeyResult[];
  description?: string;
  category: "Individual" | "Team";
  owners: string[];
  status?: OKRStatus;
  startDate?: Date;
  endDate?: Date;
}): OKR {
  const now = new Date();
  return {
    userId: params.userId,
    objective: params.objective,
    description: params.description || "",
    keyResults: params.keyResults,
    category: params.category,
    owners: params.owners,
    status: params.status || "active",
    startDate: params.startDate || now,
    endDate: params.endDate || new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()), // Default to 3 months from now
    createdAt: now,
    updatedAt: now,
  };

}
