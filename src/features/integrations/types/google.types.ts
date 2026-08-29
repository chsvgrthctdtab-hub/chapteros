import type { GoogleConnection, GoogleConnectionStatus, GoogleConnectionType, GoogleServiceKey } from '@/types';

export interface ConnectGooglePayload {
  userId?: string;
  organizationId?: string;
  connectionType: GoogleConnectionType;
  googleEmail: string;
  googleName?: string;
  googleAvatarUrl?: string;
  googleAccountId?: string;
  grantedScopes: string[];
  metadata?: Record<string, unknown>;
}

export interface DisconnectGooglePayload {
  connectionId: string;
  connectionType: GoogleConnectionType;
  organizationId?: string;
  userId?: string;
}

export interface VerifyGooglePayload {
  connectionId: string;
}

export interface GoogleIntegrationHealthItem {
  key: string;
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface GoogleIntegrationOverview {
  userConnection: GoogleConnection | null;
  orgConnection: GoogleConnection | null;
  isUserConnected: boolean;
  isOrgConnected: boolean;
  userScopes: string[];
  orgScopes: string[];
  healthItems: GoogleIntegrationHealthItem[];
  overallStatus: GoogleConnectionStatus;
}

export interface GoogleServiceReadinessInfo {
  key: GoogleServiceKey;
  name: string;
  tagline: string;
  description: string;
  phase: string;
  targetFeatures: string[];
  requiredScopes: string[];
  isScopeGranted: boolean;
  readinessState: 'ready_for_phase' | 'missing_scopes' | 'not_connected';
}

export interface GoogleServiceMetrics {
  forms: {
    totalForms: number;
    totalResponses: number;
    totalMatched: number;
    lastSyncedAt: string | null;
  };
  sheets: {
    totalConnections: number;
    lastExportAt: string | null;
    lastImportAt: string | null;
  };
  calendar: {
    totalEvents: number;
    primaryCalendar: string;
    lastSyncedAt: string | null;
  };
  drive: {
    totalDocuments: number;
    totalFolders: number;
    lastLinkedAt: string | null;
  };
}

export interface IntegrationSyncActivity {
  id: string;
  service: GoogleServiceKey;
  action: string;
  actionTitle: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  timestamp: string;
  actorName?: string;
  details?: Record<string, unknown>;
}
