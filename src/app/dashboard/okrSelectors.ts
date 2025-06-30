// Selector functions for OKR dashboard stats (Best_Practices.md compliant)
// Pure, modular, and easily testable

export interface Okr {
  _id: string;
  objective: string;
  description?: string;
  status: 'on_track' | 'off_track' | 'at_risk' | 'completed' | 'archived' | 'deleted' | string;
  owners?: Array<{ _id: string; name?: string; avatarUrl?: string }>;
  department?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function selectActiveOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr =>
    okr.status !== 'deleted' && okr.status !== 'archived'
  );
}

export function selectOnTrackOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'on_track');
}

export function selectAtRiskOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'at_risk');
}

export function selectCompletedOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'completed');
}

export function selectOffTrackOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'off_track');
}

export function selectArchivedOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'archived');
}

export function selectDeletedOkrs(okrs: Okr[]): Okr[] {
  return okrs.filter(okr => okr.status === 'deleted');
}
