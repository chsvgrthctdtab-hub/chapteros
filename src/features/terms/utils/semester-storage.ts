import type { Term } from '@/types';
import type { TermSemesterConfig } from '@/features/activities/types/competency.types';

const SEMESTER_STORAGE_KEY_PREFIX = 'chapteros_term_semesters_';

/**
 * Generate sensible default 3 semesters based on Term start and end date
 * CTUMP standard:
 * - HK1: 16 weeks (starts around Sep 5)
 * - HK2: 18 weeks (starts around Jan / Feb, includes Tet)
 * - HK3: 18 weeks (starts around May / Jun, includes summer / Green Summer)
 */
export function generateDefaultSemesters(term?: Term | null): TermSemesterConfig[] {
  if (!term || !term.startDate || !term.endDate) {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: 'hk1',
        name: 'Học kỳ I',
        startDate: `${currentYear}-09-05`,
        endDate: `${currentYear}-12-31`,
        weeks: 16,
      },
      {
        id: 'hk2',
        name: 'Học kỳ II',
        startDate: `${currentYear + 1}-01-05`,
        endDate: `${currentYear + 1}-05-15`,
        weeks: 18,
      },
      {
        id: 'hk3',
        name: 'Học kỳ III (Hè)',
        startDate: `${currentYear + 1}-05-16`,
        endDate: `${currentYear + 1}-08-31`,
        weeks: 18,
      },
    ];
  }

  const start = new Date(term.startDate);
  const end = new Date(term.endDate);
  const totalDuration = end.getTime() - start.getTime();

  // Divide total term duration into roughly: 32% (HK1), 36% (HK2), 32% (HK3)
  const hk1End = new Date(start.getTime() + totalDuration * 0.32);
  const hk2Start = new Date(hk1End.getTime() + 24 * 3600 * 1000);
  const hk2End = new Date(start.getTime() + totalDuration * 0.68);
  const hk3Start = new Date(hk2End.getTime() + 24 * 3600 * 1000);

  const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

  return [
    {
      id: 'hk1',
      name: 'Học kỳ I',
      startDate: formatDateStr(start),
      endDate: formatDateStr(hk1End),
      weeks: 16,
    },
    {
      id: 'hk2',
      name: 'Học kỳ II',
      startDate: formatDateStr(hk2Start),
      endDate: formatDateStr(hk2End),
      weeks: 18,
    },
    {
      id: 'hk3',
      name: 'Học kỳ III (Hè)',
      startDate: formatDateStr(hk3Start),
      endDate: formatDateStr(end),
      weeks: 18,
    },
  ];
}

/**
 * Retrieve saved semester configuration for a specific Term or Term ID, or fall back to defaults
 */
export function getTermSemesters(termOrId?: Term | string | null): TermSemesterConfig[] {
  if (!termOrId) {
    return generateDefaultSemesters(null);
  }

  const termId = typeof termOrId === 'string' ? termOrId : termOrId.id;
  const termObj = typeof termOrId === 'object' ? termOrId : null;

  try {
    const raw = localStorage.getItem(`${SEMESTER_STORAGE_KEY_PREFIX}${termId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read error
  }

  return generateDefaultSemesters(termObj);
}

/**
 * Save customized semester date configuration for a Term
 */
export function saveTermSemesters(
  termId: string,
  semesters: TermSemesterConfig[]
): void {
  if (!termId || !Array.isArray(semesters)) return;
  try {
    localStorage.setItem(
      `${SEMESTER_STORAGE_KEY_PREFIX}${termId}`,
      JSON.stringify(semesters)
    );
  } catch (err) {
    console.error('Failed to save semester configuration to storage:', err);
  }
}
