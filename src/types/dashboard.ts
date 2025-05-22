export interface OkrStats {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  completed: number;
}

export interface OkrDeadline {
  _id: string;
  objective: string;
  dueDate: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'not_started';
  keyResults: Array<{
    title: string;
    progress: number;
  }>;
}

export interface Activity {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

export interface DashboardData {
  okrStats: OkrStats;
  upcomingDeadlines: OkrDeadline[];
  recentActivity: Activity[];
  teamOkrStatus: OkrStats | null;
  user: {
    name: string;
    role: string;
    department: string;
  };
}
