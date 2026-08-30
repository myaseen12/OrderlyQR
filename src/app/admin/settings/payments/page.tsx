'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { Wallet, CreditCard, Banknote, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export default function AdminPaymentSettingsPage() {
  const [envMode] = useState<string>(process.env.NEXT_PUBLIC_PAYMENT_ENVIRONMENT || 'sandbox')

  const providers = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa Merchant Gateway',
      type: 'Mobile Wallet / QR',
      icon: Wallet,
      iconColor: 'text-emerald-600',
      status: process.env.NEXT_PUBLIC_EASYPAISA_MERCHANT_ID ? 'CONNECTED' : 'NOT CONFIGURED',
      envVars: ['EASYPAISA_MERCHANT_ID', 'EASYPAISA_STORE_ID', 'EASYPAISA_HASH_KEY']
    },
    {
      id: 'jazzcash',
      name: 'JazzCash Direct Gateway',
      type: 'Mobile Wallet / Card / Voucher',
      icon: Wallet,
      iconColor: 'text-rose-600',
      status: process.env.NEXT_PUBLIC_JAZZCASH_MERCHANT_ID ? 'CONNECTED' : 'NOT CONFIGURED',
      envVars: ['JAZZCASH_MERCHANT_ID', 'JAZZCASH_PASSWORD', 'JAZZCASH_INTEGRITY_SALT']
    },
    {
      id: 'card',
      name: 'Visa / Mastercard PCI Hosted Checkout',
      type: 'Debit & Credit Card',
      icon: CreditCard,
      iconColor: 'text-blue-600',
      status: process.env.NEXT_PUBLIC_CARD_GATEWAY_ID ? 'CONNECTED' : 'NOT CONFIGURED',
      envVars: ['CARD_GATEWAY_ID', 'CARD_SECRET_KEY']
    },
    {
      id: 'cash',
      name: 'Cash at Restaurant / Counter',
      type: 'Dine-In & Counter Cash Settlement',
      icon: Banknote,
      iconColor: 'text-amber-600',
      status: 'CONNECTED',
      envVars: []
    }
  ]

  return (
    <div className="space-y-8">
      
      <PageHeader 
        title="Payment Gateway Settings"
        description="Manage online payment integrations and environment status (PKR)."
        fallbackUrl="/admin/settings"
      />

      {/* Environment Status Banner */}
      <div className="bg-white border border-ticket-edge rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-ink uppercase tracking-wider">Gateway Environment: {envMode.toUpperCase()}</h3>
            <p className="text-xs text-ink/60 mt-0.5">Switch environment using PAYMENT_ENVIRONMENT in your .env file.</p>
          </div>
        </div>

        <Badge variant={envMode === 'production' ? 'sage' : 'secondary'} className="font-mono text-xs px-3 py-1">
          {envMode === 'production' ? '● PRODUCTION ACTIVE' : '● SANDBOX MODE'}
        </Badge>
      </div>

      {/* Provider Status List */}
      <div className="space-y-4">
        {providers.map((p) => {
          const Icon = p.icon
          return (
            <Card key={p.id} className="bg-white border border-ticket-edge">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-background border border-ticket-edge flex items-center justify-center shrink-0">
                    <Icon className={`h-6 w-6 ${p.iconColor}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-ink">{p.name}</h4>
                      <Badge 
                        variant={p.status === 'CONNECTED' ? 'sage' : 'secondary'} 
                        className={`text-[9px] font-mono ${p.status === 'NOT CONFIGURED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}`}
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink/60 mt-0.5 font-mono">{p.type}</p>
                  </div>
                </div>

                {p.envVars.length > 0 && (
                  <div className="text-right text-[10px] font-mono text-ink/40 space-y-0.5">
                    {p.envVars.map(v => (
                      <div key={v} className="flex items-center gap-1">
                        <Lock className="h-3 w-3 text-ink/30" /> {v}
                      </div>
                    ))}
                  </div>
                )}

              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
