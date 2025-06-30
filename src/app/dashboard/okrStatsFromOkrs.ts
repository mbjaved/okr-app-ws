// Utility to compute OkrStats from an array of OKRs using selectors
// Best_Practices.md: modular, pure, typed, and easy to test
import type { Okr } from './okrSelectors';
import {
  selectActiveOkrs,
  selectOnTrackOkrs,
  selectAtRiskOkrs,
  selectOffTrackOkrs,
  selectCompletedOkrs
} from './okrSelectors';

export interface OkrStats {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  completed: number;
}

export function computeOkrStats(okrs: Okr[]): OkrStats {
  return {
    total: selectActiveOkrs(okrs).length,
    onTrack: selectOnTrackOkrs(okrs).length,
    atRisk: selectAtRiskOkrs(okrs).length,
    offTrack: selectOffTrackOkrs(okrs).length,
    completed: selectCompletedOkrs(okrs).length,
  };
}
