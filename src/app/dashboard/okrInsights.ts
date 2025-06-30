// Dashboard insights and selectors for advanced widgets
// Best_Practices.md: modular, pure, typed, and easy to test
import type { Okr } from './okrSelectors';

// Returns OKRs that are overdue (past endDate, not completed)
export function selectOverdueOkrs(okrs: Okr[], today: Date = new Date()): Okr[] {
  return okrs.filter(okr => {
    if (okr.status === 'completed') return false;
    if (!okr.endDate) return false;
    return new Date(okr.endDate) < today;
  });
}

// Returns OKRs completed in the last N days
export function selectRecentlyCompletedOkrs(okrs: Okr[], days: number = 30, today: Date = new Date()): Okr[] {
  return okrs.filter(okr => {
    if (okr.status !== 'completed') return false;
    if (!okr.updatedAt) return false;
    const updated = new Date(okr.updatedAt);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days);
    return updated >= cutoff;
  });
}

// Returns OKRs grouped by department
export function groupOkrsByDepartment(okrs: Okr[]): Record<string, Okr[]> {
  return okrs.reduce((acc, okr) => {
    const dept = okr.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(okr);
    return acc;
  }, {} as Record<string, Okr[]>);
}
