'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Building2, 
  Layers, 
  Coffee, 
  QrCode, 
  MessageSquare, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function AdminOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, name: 'Branch Details', icon: Building2, desc: 'Set up restaurant organization & branch info' },
    { id: 2, name: 'Menu Categories', icon: Layers, desc: 'Create initial dish categories' },
    { id: 3, name: 'Add First Dishes', icon: Coffee, desc: 'Register menu items with prices & photos' },
    { id: 4, name: 'Tables & QR Codes', icon: QrCode, desc: 'Generate table tokens & QR codes' },
    { id: 5, name: 'WhatsApp Bot', icon: MessageSquare, desc: 'Configure cloud API order notifications' }
  ]

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto py-4">
      <PageHeader
        title="Restaurant Setup Wizard"
        description="Follow our 5-step checklist to configure your OrderlyQR SaaS environment"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Onboarding Wizard' }
        ]}
      />

      {/* Progress Bar Header */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step) => {
          const Icon = step.icon
          const isDone = step.id < currentStep
          const isCurrent = step.id === currentStep
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                isCurrent 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : isDone 
                  ? 'bg-sage/10 text-sage-hover border-sage/20 font-bold' 
                  : 'bg-white text-ink/50 border-ticket-edge'
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                {isDone ? <Check className="h-4 w-4 text-sage-hover" /> : <Icon className="h-4 w-4 shrink-0" />}
                <span className="hidden sm:inline">Step {step.id}</span>
              </div>
              <span className="text-[10px] font-mono truncate hidden sm:block">{step.name}</span>
            </button>
          )
        })}
      </div>

      {/* Active Step Content Card */}
      <Card className="bg-white border border-ticket-edge shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-mono font-bold text-lg">
              {currentStep}
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">{steps[currentStep - 1].name}</h3>
              <p className="text-xs text-ink/60 font-mono mt-0.5">{steps[currentStep - 1].desc}</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-background border border-ticket-edge space-y-3">
            <p className="text-xs text-ink/80 leading-relaxed font-mono">
              Step {currentStep} checklist: Configure your {steps[currentStep - 1].name.toLowerCase()} settings to enable automated kitchen ticket dispatches and QR customer ordering.
            </p>
            <div className="flex gap-2 flex-wrap">
              {currentStep === 1 && <Link href="/admin/settings"><Button size="sm" className="text-xs font-mono">Go to Settings</Button></Link>}
              {currentStep === 2 && <Link href="/admin/categories"><Button size="sm" className="text-xs font-mono">Manage Categories</Button></Link>}
              {currentStep === 3 && <Link href="/admin/menu"><Button size="sm" className="text-xs font-mono">Open Menu Manager</Button></Link>}
              {currentStep === 4 && <Link href="/admin/tables"><Button size="sm" className="text-xs font-mono">Generate QR Codes</Button></Link>}
              {currentStep === 5 && <Link href="/admin/settings"><Button size="sm" className="text-xs font-mono">Configure WhatsApp</Button></Link>}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-dashed border-ticket-edge">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="text-xs font-mono"
            >
              Previous Step
            </Button>

            {currentStep < 5 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                className="text-xs font-mono gap-1"
              >
                Next Step
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Link href="/admin">
                <Button size="sm" className="text-xs font-mono gap-1 bg-sage-hover text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Complete Setup
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
