'use client'

import React from 'react'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  fallbackUrl?: string
  backLabel?: string
  showBack?: boolean
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  unsavedChanges?: boolean
  className?: string
}

export function PageHeader({
  title,
  description,
  fallbackUrl = '/admin',
  backLabel = 'Back',
  showBack = true,
  breadcrumbs,
  actions,
  unsavedChanges = false,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 pb-4 border-b border-dashed border-ticket-edge select-none ${className}`}>
      
      {/* Breadcrumbs Navigation Row */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] font-mono text-ink/40">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-ink/30 shrink-0" />}
              {crumb.href ? (
                <Link 
                  href={crumb.href} 
                  className="hover:text-ink hover:underline transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink font-bold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <BackButton 
              fallbackUrl={fallbackUrl} 
              label={backLabel} 
              unsavedChanges={unsavedChanges} 
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight font-sans">{title}</h1>
            {description && (
              <p className="text-xs text-ink/50 font-mono mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

    </div>
  )
}
