'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onCancel}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white rounded-xl border border-ticket-edge shadow-2xl max-w-sm w-full overflow-hidden pointer-events-auto select-none"
            >
              {/* Receipt edge effect */}
              <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {/* Header Header */}
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDestructive ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">{title}</h3>
                    <p className="text-xs text-ink/60 mt-1 leading-relaxed">{message}</p>
                  </div>
                </div>

                {/* Dashed Tear separator */}
                <div className="border-t border-dashed border-ink/15 my-2" />

                {/* Actions footer */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 font-mono text-xs"
                    onClick={onCancel}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    variant={isDestructive ? 'primary' : 'secondary'}
                    size="sm"
                    className={`h-9 px-4 font-mono text-xs font-bold uppercase tracking-wider ${
                      isDestructive ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                    }`}
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </Button>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
