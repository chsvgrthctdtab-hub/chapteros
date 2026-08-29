import React from 'react';
import { TaskSummary } from './TaskSummary';
import type { TaskStats } from '../types/task.types';

interface TaskStatsBannerProps {
  stats: TaskStats;
  currentStatusFilter?: string;
  isOverdueFilterActive?: boolean;
  onSelectStatusFilter: (status: string) => void;
  onToggleOverdueFilter: () => void;
}

export function TaskStatsBanner(props: TaskStatsBannerProps) {
  return <TaskSummary {...props} />;
}
