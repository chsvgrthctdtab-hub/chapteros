import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions, badge }: PageHeaderProps) {
  return (
    <div id="page-header" className="mb-6 sm:mb-8 space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-1.5">
          <BreadcrumbList>
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-ink-navy text-xs sm:text-sm">{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href || '#'} className="text-xs sm:text-sm text-slate-gray hover:text-ink-navy">{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="text-mist-gray" />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-navy">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm sm:text-base text-slate-gray max-w-3xl leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

