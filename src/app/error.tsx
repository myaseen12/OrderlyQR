'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] bg-background text-ink p-6 select-none">
      <Card className="max-w-xs w-full text-center overflow-hidden border-red-200">
        <div className="bg-red-50 p-6 flex justify-center border-b border-red-100 text-red-500">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-base text-ink">Something went wrong</h3>
          <p className="text-xs text-ink/65 leading-relaxed">
            The ordering application encountered an error while processing the ticket. Please try again.
          </p>
          <Button size="sm" onClick={() => reset()} className="w-full gap-1.5 font-mono text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Session
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
