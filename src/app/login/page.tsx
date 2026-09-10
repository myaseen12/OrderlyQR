'use client'

import React, { useActionState, startTransition } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { Mail, Lock, ChefHat, Loader2, ArrowRight, ChevronLeft } from 'lucide-react'

import { BackButton } from '@/components/ui/BackButton'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  const handleDemoLogin = () => {
    const formData = new FormData()
    formData.append('email', 'staff@bistrorustique.com')
    formData.append('password', 'password123')
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col items-center justify-center p-6 select-none relative">
      <BackButton fallbackUrl="/" label="Home" className="absolute top-6 left-6" />
      
      {/* Platform Branding */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-lg border border-primary/20">
          🪵
        </div>
        <span className="font-bold text-lg tracking-tight font-mono">
          Orderly<span className="text-primary">QR</span>
        </span>
      </div>

      <Card className="max-w-sm w-full bg-white relative shadow-lg overflow-hidden border border-ticket-edge">
        {/* Decorative receipt tear top */}
        <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
          ))}
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h1 className="font-bold text-lg text-ink">Staff Sign In</h1>
            <p className="text-xs text-ink/50 mt-1">Access your restaurant order console</p>
          </div>

          <TicketDivider />

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-mono">
              ⚠️ {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@restaurant.com"
                  className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4" />
                  Sign In to Kitchen
                </>
              )}
            </Button>
          </form>

          <TicketDivider />

          {/* Quick Demo Login Action Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoLogin}
            disabled={isPending}
            className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-2 border-dashed border-primary/40 hover:bg-primary/5 text-primary"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChefHat className="h-4 w-4 text-primary" />
            )}
            Try Demo Kitchen Console
          </Button>

          {process.env.NEXT_PUBLIC_ENV !== 'production' && process.env.NODE_ENV !== 'production' && (
            <DemoCredentialsBlock />
          )}

          <div className="text-center pt-2">
            <p className="text-[11px] text-ink/60">
              New restaurant owner?{' '}
              <Link href="/signup" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5">
                Onboard here <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

function DemoCredentialsBlock() {
  return (
    <div className="bg-background border border-ticket-edge rounded-lg p-3 space-y-1">
      <span className="text-[9px] font-mono font-bold text-ink/40 uppercase block">Developer Sandbox Mode</span>
      <p className="text-[10px] font-mono text-ink/65">
        Sandbox environment active for local development.
      </p>
    </div>
  )
}
