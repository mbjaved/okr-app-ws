// Quarter Detection Utility for OKR Filtering
// Auto-detects quarters from OKR start and end dates

export interface Quarter {
  value: string; // e.g., "2024-Q1", "2025-Q2"
  label: string; // e.g., "Q1 2024", "Q2 2025"
  year: number;
  quarter: number;
}

/**
 * Get quarter number (1-4) from a date
 */
export function getQuarterFromDate(date: Date): number {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  return Math.ceil(month / 3);
}

/**
 * Get quarter object from a date
 */
export function getQuarterObjectFromDate(date: Date): Quarter {
  const year = date.getFullYear();
  const quarter = getQuarterFromDate(date);
  return {
    value: `${year}-Q${quarter}`,
    label: `Q${quarter} ${year}`,
    year,
    quarter
  };
}

/**
 * Get all quarters that an OKR spans based on its start and end dates
 */
export function getOkrQuarters(startDate?: string, endDate?: string): Quarter[] {
  if (!startDate && !endDate) return [];
  
  const quarters: Quarter[] = [];
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  // If we only have one date, use it for both
  const effectiveStart = start || end!;
  const effectiveEnd = end || start!;
  
  // Get start and end quarters
  const startQuarter = getQuarterObjectFromDate(effectiveStart);
  const endQuarter = getQuarterObjectFromDate(effectiveEnd);
  
  // If same quarter, return just one
  if (startQuarter.value === endQuarter.value) {
    return [startQuarter];
  }
  
  // Generate all quarters between start and end
  let currentDate = new Date(effectiveStart);
  const endTime = effectiveEnd.getTime();
  
  while (currentDate.getTime() <= endTime) {
    const quarterObj = getQuarterObjectFromDate(currentDate);
    
    // Avoid duplicates
    if (!quarters.find(q => q.value === quarterObj.value)) {
      quarters.push(quarterObj);
    }
    
    // Move to next quarter
    const currentQuarter = getQuarterFromDate(currentDate);
    if (currentQuarter === 4) {
      // Move to Q1 of next year
      currentDate = new Date(currentDate.getFullYear() + 1, 0, 1); // Jan 1 of next year
    } else {
      // Move to next quarter of same year
      currentDate = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
    }
  }
  
  return quarters;
}

/**
 * Extract all unique quarters from a list of OKRs
 */
export function extractQuartersFromOkrs(okrs: Array<{startDate?: string; endDate?: string}>): Quarter[] {
  const quarterMap = new Map<string, Quarter>();
  
  okrs.forEach(okr => {
    const quarters = getOkrQuarters(okr.startDate, okr.endDate);
    quarters.forEach(quarter => {
      quarterMap.set(quarter.value, quarter);
    });
  });
  
  // Sort quarters by year and quarter number
  return Array.from(quarterMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.quarter - b.quarter;
  });
}

/**
 * Check if an OKR matches selected quarter filters
 */
export function okrMatchesQuarters(okr: {startDate?: string; endDate?: string}, selectedQuarters: string[]): boolean {
  if (selectedQuarters.length === 0) return true;
  
  const okrQuarters = getOkrQuarters(okr.startDate, okr.endDate);
  const okrQuarterValues = okrQuarters.map(q => q.value);
  
  // Return true if any of the OKR's quarters match any selected quarter
  return selectedQuarters.some(selectedQuarter => 
    okrQuarterValues.includes(selectedQuarter)
  );
}
