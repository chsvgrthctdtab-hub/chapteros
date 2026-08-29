import type { DataQualityCategory, DataQualityChecker } from '../types';
import { memberQualityChecker } from './member.checker';
import { termQualityChecker } from './term.checker';
import { activityQualityChecker } from './activity.checker';
import { taskQualityChecker } from './task.checker';
import { financeQualityChecker } from './finance.checker';
import { documentQualityChecker } from './document.checker';

export {
  memberQualityChecker,
  termQualityChecker,
  activityQualityChecker,
  taskQualityChecker,
  financeQualityChecker,
  documentQualityChecker,
};

export const QUALITY_CHECKERS: Record<DataQualityCategory, DataQualityChecker | null> = {
  members: memberQualityChecker,
  terms: termQualityChecker,
  activities: activityQualityChecker,
  tasks: taskQualityChecker,
  finance: financeQualityChecker,
  documents: documentQualityChecker,
  system: null,
};

export const ALL_CHECKERS: DataQualityChecker[] = [
  memberQualityChecker,
  termQualityChecker,
  activityQualityChecker,
  taskQualityChecker,
  financeQualityChecker,
  documentQualityChecker,
];
