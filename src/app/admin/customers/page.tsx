'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Users, 
  Award, 
  DollarSign, 
  RotateCcw, 
  Loader2 as Loader,
  Star
} from 'lucide-react'

interface CustomerProfile {
  id: string
  name: string
  phone: string
  email: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'vip'
  total_spent: number
  visit_count: number
  last_visit: string
}

export default function AdminCustomersPage() {
  const { restaurant } = useAdmin()
  const [customers, setCustomers] = useState<CustomerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const loadCustomers = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('restaurant_id', restaurant.id)

      if (data) setCustomers(data as CustomerProfile[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [restaurant?.id, supabase])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const totalPointsAwarded = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.points || 0), 0)
  }, [customers])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 select-none">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-6xl">
      <PageHeader
        title="Customer CRM & Loyalty System"
        description="Track guest dining frequency, rewards tiers, and lifetime spending"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Customer CRM' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadCustomers} className="text-xs font-mono h-8 border-dashed">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reload CRM
          </Button>
        }
      />

      {/* CRM Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Registered Guests</span>
              <span className="text-base font-mono font-bold text-ink">{customers.length} Profiles</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-mustard/15 text-mustard-hover rounded-xl flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Total Points Ledger</span>
              <span className="text-base font-mono font-bold text-ink">{totalPointsAwarded} Pts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-sage/10 text-sage-hover rounded-xl flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">VIP Tier Guests</span>
              <span className="text-base font-mono font-bold text-ink">
                {customers.filter(c => c.tier === 'gold' || c.tier === 'vip').length} VIPs
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Profiles Ledger Table */}
      <div className="bg-white border border-ticket-edge rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dashed border-ticket-edge flex justify-between items-center">
          <h3 className="font-mono text-xs font-bold text-ink uppercase tracking-wide">Guest Loyalty Directory</h3>
          <Badge variant="sage" className="text-[9px]">Privacy Compliant</Badge>
        </div>

        {customers.length === 0 ? (
          <div className="p-12 text-center text-ink/40 font-mono text-xs">
            No customer profiles registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-background text-ink/50 border-b border-ticket-edge uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Visits</th>
                  <th className="py-3 px-4">Lifetime Spent</th>
                  <th className="py-3 px-4">Loyalty Points</th>
                  <th className="py-3 px-4">Tier Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ticket-edge">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink">{c.name}</td>
                    <td className="py-3 px-4 text-ink/65">{c.phone}</td>
                    <td className="py-3 px-4">{c.visit_count} orders</td>
                    <td className="py-3 px-4 font-bold text-sage-hover">${Number(c.total_spent).toFixed(2)}</td>
                    <td className="py-3 px-4 text-mustard-hover font-bold">{c.points} pts</td>
                    <td className="py-3 px-4">
                      {c.tier === 'gold' || c.tier === 'vip' ? (
                        <Badge variant="mustard" className="text-[9px] uppercase">{c.tier}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] uppercase">{c.tier}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
