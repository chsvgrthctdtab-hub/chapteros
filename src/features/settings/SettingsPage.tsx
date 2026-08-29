import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { isOrgAdmin, isOrgBoard } from '@/types/roles';
import {
  SettingsNavRail,
  type SettingsTabId,
} from './components/SettingsNavRail';
import { OrganizationSettingsTab } from './components/OrganizationSettingsTab';
import { ProfileSettingsTab } from './components/ProfileSettingsTab';
import { MembersRolesTab } from './components/MembersRolesTab';
import { FinanceSettingsTab } from './components/FinanceSettingsTab';
import { IntegrationsTab } from './components/IntegrationsTab';
import { SecurityTab } from './components/SecurityTab';
import { MaintenanceTab } from './components/MaintenanceTab';

export function SettingsPage() {
  const { user, profile, activeOrganization, activeRole, activeMembership } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as SettingsTabId) || 'organization';
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTabId;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: SettingsTabId) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const canManage = isOrgAdmin(activeRole);

  return (
    <div id="settings-page" className="space-y-6">
      <PageHeader
        title="Settings & Administration"
        description="Quản lý danh tính Chi hội, phân quyền nhân sự Ban Chấp Hành, hạn mức tài chính và tích hợp dịch vụ đám mây."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings' },
        ]}
      />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Rail */}
        <div className="lg:col-span-1 sticky top-20">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs">
            <SettingsNavRail activeTab={activeTab} onSelectTab={handleSelectTab} />
          </div>
        </div>

        {/* Right Active Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'organization' && (
            <OrganizationSettingsTab
              organization={activeOrganization}
              canManage={canManage}
            />
          )}

          {activeTab === 'profile' && <ProfileSettingsTab />}

          {activeTab === 'roles' && (
            <MembersRolesTab
              organization={activeOrganization}
              canManage={canManage}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceSettingsTab
              organization={activeOrganization}
              canManage={canManage}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsTab organization={activeOrganization} />
          )}

          {activeTab === 'security' && (
            <SecurityTab organization={activeOrganization} />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab organization={activeOrganization} />
          )}
        </div>
      </div>
    </div>
  );
}
