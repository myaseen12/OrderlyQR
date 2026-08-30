'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

export interface BackButtonProps {
  fallbackUrl?: string
  label?: string
  className?: string
  unsavedChanges?: boolean
  onClick?: () => void
}

export function BackButton({
  fallbackUrl = '/',
  label = 'Back',
  className = '',
  unsavedChanges = false,
  onClick
}: BackButtonProps) {
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleNavigateBack = () => {
    if (onClick) {
      onClick()
      return
    }

    if (unsavedChanges) {
      setShowConfirmModal(true)
      return
    }

    executeBackNavigation()
  }

  const executeBackNavigation = () => {
    // Check if there is meaningful history in the window session
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleNavigateBack}
        aria-label={`Go back to ${label}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ticket-edge bg-white text-ink/75 hover:text-ink hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 text-xs font-mono font-bold tracking-wide transition-all shadow-sm select-none active:scale-95 ${className}`}
      >
        <ChevronLeft className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </button>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={executeBackNavigation}
        title="Discard Unsaved Changes?"
        message="You have unsaved form inputs that will be lost if you leave this page."
        confirmText="Discard & Leave"
        cancelText="Keep Editing"
        isDestructive={true}
      />
    </>
  )
}
