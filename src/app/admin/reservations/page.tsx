'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { updateReservationStatusAction } from '@/app/menu/actions'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Calendar, 
  Users, 
  Phone, 
  Check, 
  X, 
  Clock, 
  Loader2 as Loader,
  RotateCcw
} from 'lucide-react'

interface Reservation {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  reservation_time: string
  status: 'pending' | 'accepted' | 'declined'
  notes?: string
  created_at: string
}

export default function AdminReservationsPage() {
  const { restaurant } = useAdmin()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const loadReservations = useCallback(async () => {
    if (!restaurant?.id) return
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setReservations(data as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [restaurant?.id, supabase])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const res = await updateReservationStatusAction(id, status)
      if (res.success) {
        setReservations(prev =>
          prev.map(r => r.id === id ? { ...r, status } : r)
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-5xl">
      
      {/* Header */}
      <PageHeader
        title="Table Reservations"
        description="Manage customer table booking requests"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reservations' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadReservations} className="text-xs font-mono h-8 border-dashed">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reload
          </Button>
        }
      />

      {/* Grid of Reservation Tickets */}
      {reservations.length === 0 ? (
        <Card className="bg-white p-12 text-center text-ink/40">
          <Calendar className="h-10 w-10 mx-auto mb-2 text-ink/20" />
          <p className="text-xs font-mono">No table reservations requested yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((res) => (
            <Card key={res.id} className="bg-white border border-ticket-edge overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start border-b border-dashed border-ticket-edge pb-2">
                  <div>
                    <span className="font-bold text-sm text-ink">{res.customer_name}</span>
                    <span className="text-[10px] font-mono text-ink/50 block flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {res.customer_phone}
                    </span>
                  </div>
                  <Badge variant={
                    res.status === 'accepted' ? 'sage' :
                    res.status === 'declined' ? 'secondary' : 'mustard'
                  }>
                    {res.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-ink/75">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> {res.party_size} Guests
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-ink/50">
                    <Clock className="h-3 w-3" /> {new Date(res.reservation_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                {res.notes && (
                  <div className="text-[10px] bg-background p-2 rounded-lg italic text-ink/65">
                    "{res.notes}"
                  </div>
                )}

                <TicketDivider />

                {res.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs font-mono border-red-200 text-red-500 hover:bg-red-50 h-8"
                      onClick={() => handleUpdateStatus(res.id, 'declined')}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Decline
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs font-mono h-8"
                      onClick={() => handleUpdateStatus(res.id, 'accepted')}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Accept
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
