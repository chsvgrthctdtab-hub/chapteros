import type {
  ActivityForm,
  ActivityFormResponse,
  ActivityFormStatus,
  FormSyncStatus,
  FormMatchStatus,
  FormSyncResult,
  Member,
} from '@/types';

export type {
  ActivityForm,
  ActivityFormResponse,
  ActivityFormStatus,
  FormSyncStatus,
  FormMatchStatus,
  FormSyncResult,
};

export interface CreateActivityFormPayload {
  activityId: string;
  organizationId: string;
  termId?: string | null;
  title: string;
  description?: string;
  status?: ActivityFormStatus;
  formType: 'template' | 'custom_url';
  existingFormUrl?: string;
  sheetUrl?: string;
  collectEmail?: boolean;
  collectStudentId?: boolean;
  collectPhone?: boolean;
  collectClass?: boolean;
  customQuestions?: string[];
}

export interface LinkExistingFormPayload {
  activityId: string;
  organizationId: string;
  termId?: string | null;
  formUrlOrId: string;
  title?: string;
  description?: string;
}

export interface UpdateActivityFormPayload {
  title?: string;
  description?: string;
  status?: ActivityFormStatus;
  formUrl?: string;
  editUrl?: string;
}

export interface ManualMatchMemberPayload {
  responseId: string;
  memberId: string;
  activityId: string;
  organizationId: string;
}

export interface FormResponseFilterParams {
  search?: string;
  matchStatus?: FormMatchStatus | 'all';
  page?: number;
  pageSize?: number;
}
