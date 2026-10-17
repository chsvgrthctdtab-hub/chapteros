import type { DataQualityCategory, DataQualityChecker } from '../types';
import { memberQualityChecker } from './member.checker';
import { termQualityChecker } from './term.checker';
import { activityQualityChecker } from './activity.checker';
import { taskQualityChecker } from './task.checker';
import { financeQualityChecker } from './finance.checker';

export {
  memberQualityChecker,
  termQualityChecker,
  activityQualityChecker,
  taskQualityChecker,
  financeQualityChecker,
};

export const QUALITY_CHECKERS: Record<DataQualityCategory, DataQualityChecker | null> = {
  members: memberQualityChecker,
  terms: termQualityChecker,
  activities: activityQualityChecker,
  tasks: taskQualityChecker,
  finance: financeQualityChecker,
  system: null,
};

export const ALL_CHECKERS: DataQualityChecker[] = [
  memberQualityChecker,
  termQualityChecker,
  activityQualityChecker,
  taskQualityChecker,
  financeQualityChecker,
];
