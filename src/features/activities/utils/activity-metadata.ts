import type {
  ActivityMetadata,
  SemesterId,
  TermSemesterConfig,
  ActivityScale,
} from '../types/competency.types';

const META_PREFIX = '<!--chapteros_activity_meta:';
const META_SUFFIX = '-->';

/**
 * Parse structured evaluation metadata from activity description
 */
export function parseActivityMetadata(description?: string | null): ActivityMetadata {
  if (!description) return {};

  const prefixIndex = description.indexOf(META_PREFIX);
  if (prefixIndex === -1) return {};

  const suffixIndex = description.indexOf(META_SUFFIX, prefixIndex);
  if (suffixIndex === -1) return {};

  const jsonStr = description.substring(prefixIndex + META_PREFIX.length, suffixIndex);
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Serialize activity metadata and attach to description
 */
export function serializeActivityMetadata(
  plainDescription: string = '',
  meta: Partial<ActivityMetadata>
): string {
  const cleanDesc = stripActivityMetadata(plainDescription).trim();
  
  // Clean empty/undefined properties
  const cleanMeta: Record<string, unknown> = {};
  if (meta.semester) cleanMeta.semester = meta.semester;
  if (meta.organizerScope) cleanMeta.organizerScope = meta.organizerScope;
  if (meta.activityScale) cleanMeta.activityScale = meta.activityScale;
  if (meta.competencyTags && meta.competencyTags.length > 0) {
    cleanMeta.competencyTags = meta.competencyTags;
  }
  if (meta.sv5tCriteria && meta.sv5tCriteria.length > 0) {
    cleanMeta.sv5tCriteria = meta.sv5tCriteria;
  }
  if (meta.isMonthlyUnionMeeting) cleanMeta.isMonthlyUnionMeeting = true;
  if (typeof meta.estimatedBudget === 'number' && meta.estimatedBudget > 0) {
    cleanMeta.estimatedBudget = meta.estimatedBudget;
  }

  if (Object.keys(cleanMeta).length === 0) {
    return cleanDesc;
  }

  const metaString = `${META_PREFIX}${JSON.stringify(cleanMeta)}${META_SUFFIX}`;
  return cleanDesc ? `${cleanDesc}\n\n${metaString}` : metaString;
}

/**
 * Strip metadata tags from description to display user-facing text
 */
export function stripActivityMetadata(description?: string | null): string {
  if (!description) return '';
  const prefixIndex = description.indexOf(META_PREFIX);
  if (prefixIndex === -1) return description;

  const suffixIndex = description.indexOf(META_SUFFIX, prefixIndex);
  if (suffixIndex === -1) return description;

  const before = description.substring(0, prefixIndex).trim();
  const after = description.substring(suffixIndex + META_SUFFIX.length).trim();
  return [before, after].filter(Boolean).join('\n\n');
}

/**
 * Automatically determine which semester a given date falls into based on term semesters
 */
export function determineSemesterFromDate(
  dateStr?: string | null,
  semesters: TermSemesterConfig[] = []
): SemesterId {
  if (!dateStr || semesters.length === 0) return 'hk1';

  try {
    const activityDate = new Date(dateStr).getTime();
    if (isNaN(activityDate)) return 'hk1';

    for (const sem of semesters) {
      const start = new Date(sem.startDate).getTime();
      const end = new Date(sem.endDate).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        if (activityDate >= start && activityDate <= end) {
          return sem.id;
        }
      }
    }
  } catch {
    // fallback
  }

  return 'hk1';
}

/**
 * Automatically compute Activity Scale (Lớn / Vừa / Nhỏ)
 * Rule from CTUMP Student Union:
 * - Quy mô Lớn: >200 SV hoặc kinh phí >20 triệu đồng
 * - Quy mô Vừa: 100 đến <200 SV hoặc kinh phí >1 triệu đồng
 * - Quy mô Nhỏ: 10 đến <100 SV hoặc kinh phí <1 triệu đồng
 */
export function calculateActivityScale(
  targetMembers: number = 0,
  estimatedBudget: number = 0
): ActivityScale {
  const members = Number(targetMembers) || 0;
  const budget = Number(estimatedBudget) || 0;

  if (members >= 200 || budget >= 20000000) {
    return 'large';
  }
  if (members >= 100 || budget >= 1000000) {
    return 'medium';
  }
  return 'small';
}
