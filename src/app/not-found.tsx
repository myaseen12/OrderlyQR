'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { BackButton } from '@/components/ui/BackButton'
import { HelpCircle, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-ink flex flex-col items-center justify-center p-6 select-none">
      <Card className="max-w-sm w-full text-center overflow-hidden border border-ticket-edge shadow-md">
        <div className="bg-primary/5 p-6 flex justify-center border-b border-ticket-edge text-primary">
          <HelpCircle className="h-10 w-10" />
        </div>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-base text-ink">Page Not Found</h3>
          <p className="text-xs text-ink/65 leading-relaxed">
            The requested QR dining route or admin page could not be located.
          </p>
          <div className="flex gap-2">
            <BackButton fallbackUrl="/" label="Back" className="flex-1 justify-center h-9 text-xs" />
            <Link href="/admin" className="flex-1">
              <Button size="sm" className="w-full gap-1.5 font-mono text-xs h-9">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
