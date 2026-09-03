'use client'

import React, { useActionState, startTransition, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signupAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { Mail, Lock, User, ChefHat, Loader2, ArrowLeft, Building2, Search, ChevronLeft, Sparkles } from 'lucide-react'

import { BackButton } from '@/components/ui/BackButton'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')
  const [state, formAction, isPending] = useActionState(signupAction, null)
  
  // Custom interactive state for toggling onboarding flow
  const [restaurantAction, setRestaurantAction] = useState<'register' | 'join'>('register')
  const [slugPreview, setSlugPreview] = useState('')

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/[^a-z0-9-]/g, '') // remove special characters
    setSlugPreview(formatted)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
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

      <Card className="max-w-md w-full bg-white relative shadow-lg overflow-hidden border border-ticket-edge">
        {/* Decorative receipt tear top */}
        <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
          ))}
        </div>

        <CardContent className="p-6 space-y-4">
          {selectedPlan && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center space-y-1">
              <Badge variant="sage" className="font-mono text-[9px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3 mr-1" /> {selectedPlan.toUpperCase()} PLAN SELECTED
              </Badge>
              <p className="text-[11px] font-mono text-ink/75 font-semibold">
                {selectedPlan === 'growth' ? '14-Day Free Trial included. No credit card required.' : selectedPlan === 'starter' ? 'Starter Plan selected. Instant onboarding.' : 'Enterprise Plan request. Onboard & contact team.'}
              </p>
            </div>
          )}

          <div className="text-center">
            <h1 className="font-bold text-lg text-ink">Staff & Owner Onboarding</h1>
            <p className="text-xs text-ink/50 mt-1">Set up your profile and link your kitchen</p>
          </div>

          <TicketDivider />

          {/* Toggle Onboarding Flow Action */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg border border-ticket-edge text-xs font-medium">
            <button
              type="button"
              onClick={() => setRestaurantAction('register')}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                restaurantAction === 'register' 
                  ? 'bg-white text-ink font-bold shadow-sm' 
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              New Restaurant
            </button>
            <button
              type="button"
              onClick={() => setRestaurantAction('join')}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                restaurantAction === 'join' 
                  ? 'bg-white text-ink font-bold shadow-sm' 
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Join Kitchen
            </button>
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-mono">
              ⚠️ {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action hidden input */}
            <input type="hidden" name="restaurantAction" value={restaurantAction} />

            {/* Profile fields */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Your Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="E.g., Chef Alex Rossi"
                  className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="chef@restaurant.com"
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
                  placeholder="Min. 6 characters"
                  className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Restaurant Fields depending on action */}
            {restaurantAction === 'register' ? (
              <>
                <input type="hidden" name="role" value="owner" />
                
                <div className="space-y-1.5 border-t border-ticket-edge pt-3">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase block">Restaurant Name</label>
                  <input
                    type="text"
                    name="restaurantName"
                    required={restaurantAction === 'register'}
                    placeholder="E.g., Bistro Rustique"
                    className="w-full text-xs px-3 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase block">Restaurant Slug (URL)</label>
                  <input
                    type="text"
                    name="restaurantSlug"
                    required={restaurantAction === 'register'}
                    placeholder="e.g. bistro-rustique"
                    onChange={handleSlugChange}
                    className="w-full text-xs px-3 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono lowercase"
                  />
                  {slugPreview && (
                    <span className="text-[10px] font-mono text-ink/40 block mt-1">
                      Menu URL: <code className="bg-ink/5 px-1 py-0.5 rounded">orderlyqr.com/r/{slugPreview}</code>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Staff Join Fields */}
                <div className="space-y-1.5 border-t border-ticket-edge pt-3">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Your Assigned Kitchen Role</label>
                  <select
                    name="role"
                    required={restaurantAction === 'join'}
                    className="w-full text-xs px-3 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="kitchen_staff">Kitchen Staff</option>
                    <option value="admin">Restaurant Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase block">Restaurant Slug to Join</label>
                  <input
                    type="text"
                    name="restaurantSlug"
                    required={restaurantAction === 'join'}
                    placeholder="e.g. bistro-rustique"
                    className="w-full text-xs px-3 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono lowercase"
                  />
                  <span className="text-[9px] font-mono text-ink/40 block mt-1">
                    Ask your restaurant owner for the exact subdomain/slug identifier.
                  </span>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4" />
                  Complete Onboarding
                </>
              )}
            </Button>
          </form>

          <TicketDivider />

          <div className="text-center">
            <p className="text-[11px] text-ink/60">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5">
                <ArrowLeft className="h-3 w-3 mr-0.5" /> Sign In
              </Link>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
