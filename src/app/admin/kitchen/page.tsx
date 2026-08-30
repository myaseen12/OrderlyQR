'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { updateOrderStatusAction } from '@/app/menu/actions'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  ChefHat, 
  Clock, 
  Bell, 
  X, 
  Play, 
  Loader2 as Loader,
  RotateCcw,
  Check
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface OrderAddonSnapshot {
  id: string
  addon_name_snapshot: string
  price_snapshot: number
}

interface OrderItemSnapshot {
  id: string
  item_name_snapshot: string
  price_snapshot: number
  quantity: number
  notes?: string
  order_item_addons?: OrderAddonSnapshot[]
}

interface FullOrder {
  id: string
  restaurant_id: string
  order_number: string
  customer_name: string
  customer_phone?: string
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled'
  subtotal: number
  total: number
  notes?: string
  created_at: string
  restaurant_tables?: {
    table_number: string
  } | null
  order_items: OrderItemSnapshot[]
}

export default function AdminKitchenPage() {
  const { restaurant } = useAdmin()
  const [orders, setOrders] = useState<FullOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  // Load orders from Supabase
  const loadOrders = useCallback(async () => {
    if (!restaurant?.id) return
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          restaurant_id,
          order_number,
          customer_name,
          customer_phone,
          status,
          subtotal,
          total,
          notes,
          created_at,
          restaurant_tables (
            table_number
          ),
          order_items (
            id,
            item_name_snapshot,
            price_snapshot,
            quantity,
            notes,
            order_item_addons (
              id,
              addon_name_snapshot,
              price_snapshot
            )
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data as any)
      }
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurant?.id, supabase])

  useEffect(() => {
    loadOrders()

    if (!restaurant?.id) return

    // Set up realtime channel
    const channel = supabase
      .channel('kitchen-orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playIncomingChime()
          }
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurant?.id, loadOrders, soundEnabled, supabase])

  const playIncomingChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.18)
    } catch (err) {
      console.warn('Audio blocked by user permissions')
    }
  }

  const updateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await updateOrderStatusAction(orderId, nextStatus)

      if (!res.success) {
        alert(`Failed to update order status: ${res.error}`)
        return
      }

      setOrders(prev => 
        prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o)
      )

      if (nextStatus === 'ready') {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } })
      } else if (nextStatus === 'served') {
        confetti({ particleCount: 15, spread: 35, colors: ['#81B29A', '#FAF8F5'] })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const nextStatusMap: Record<string, string | null> = {
    pending: 'accepted',
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'served',
    served: null,
    cancelled: null
  }

  const statusActionLabels: Record<string, string> = {
    pending: 'Accept',
    accepted: 'Start Preparing',
    preparing: 'Mark Ready',
    ready: 'Mark Served'
  }

  const lanes = useMemo(() => {
    return {
      new: orders.filter(o => o.status === 'pending'),
      preparing: orders.filter(o => o.status === 'preparing' || o.status === 'accepted'),
      ready: orders.filter(o => o.status === 'ready'),
      served: orders.filter(o => o.status === 'served' || o.status === 'cancelled')
    }
  }, [orders])

  const getElapsedMinutes = (createdAtString: string) => {
    const elapsedMs = Date.now() - new Date(createdAtString).getTime()
    return Math.max(0, Math.floor(elapsedMs / (60 * 1000)))
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none">
      
      {/* Header controls */}
      <PageHeader
        title="Kitchen Order Tickets (KOT)"
        description="Chef console for managing active cooking orders"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Kitchen Board' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-mono ${
                soundEnabled 
                  ? 'bg-sage/10 text-sage-hover border-sage/20 font-bold' 
                  : 'bg-white text-ink/55 border-ticket-edge'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Alert Chime: {soundEnabled ? 'ON' : 'OFF'}
            </button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-mono h-8 border-dashed"
              onClick={loadOrders}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* 4-Column Board layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start pb-10">
        
        {/* Column 1: NEW */}
        <div className="space-y-4">
          <div className="bg-mustard/15 border border-mustard/30 p-3 rounded-xl flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-amber-800 uppercase">NEW</span>
            <Badge variant="mustard">{lanes.new.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {lanes.new.length === 0 ? (
              <p className="text-center py-10 text-[11px] font-mono text-ink/40">Queue empty</p>
            ) : (
              lanes.new.map(order => (
                <KOTCard key={order.id} order={order} getElapsed={getElapsedMinutes} onAdvance={updateStatus} nextStatus={nextStatusMap[order.status]} actionLabel={statusActionLabels[order.status]} />
              ))
            )}
          </div>
        </div>

        {/* Column 2: PREPARING */}
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-primary uppercase">PREPARING</span>
            <Badge variant="default">{lanes.preparing.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {lanes.preparing.length === 0 ? (
              <p className="text-center py-10 text-[11px] font-mono text-ink/40">Pans are cold</p>
            ) : (
              lanes.preparing.map(order => (
                <KOTCard key={order.id} order={order} getElapsed={getElapsedMinutes} onAdvance={updateStatus} nextStatus={nextStatusMap[order.status]} actionLabel={statusActionLabels[order.status]} />
              ))
            )}
          </div>
        </div>

        {/* Column 3: READY */}
        <div className="space-y-4">
          <div className="bg-sage/10 border border-sage/20 p-3 rounded-xl flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-sage-hover uppercase">READY</span>
            <Badge variant="sage">{lanes.ready.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {lanes.ready.length === 0 ? (
              <p className="text-center py-10 text-[11px] font-mono text-ink/40">No orders ready</p>
            ) : (
              lanes.ready.map(order => (
                <KOTCard key={order.id} order={order} getElapsed={getElapsedMinutes} onAdvance={updateStatus} nextStatus={nextStatusMap[order.status]} actionLabel={statusActionLabels[order.status]} />
              ))
            )}
          </div>
        </div>

        {/* Column 4: SERVED */}
        <div className="space-y-4">
          <div className="bg-ink/5 border border-ink/10 p-3 rounded-xl flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-ink/70 uppercase">SERVED</span>
            <Badge variant="secondary">{lanes.served.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {lanes.served.length === 0 ? (
              <p className="text-center py-10 text-[11px] font-mono text-ink/40">No history today</p>
            ) : (
              lanes.served.slice(0, 10).map(order => (
                <KOTCard key={order.id} order={order} getElapsed={getElapsedMinutes} onAdvance={updateStatus} nextStatus={null} actionLabel="" />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

function KOTCard({ 
  order, 
  getElapsed, 
  onAdvance, 
  nextStatus, 
  actionLabel 
}: { 
  order: FullOrder
  getElapsed: (t: string) => number
  onAdvance: (id: string, st: string) => void
  nextStatus: string | null
  actionLabel: string
}) {
  const elapsed = getElapsed(order.created_at)
  const isNew = order.status === 'pending'
  const isUrgent = elapsed > 15 && order.status !== 'served' && order.status !== 'cancelled'

  return (
    <Card className={`overflow-hidden hover:shadow-ticket-hover transition-all select-none border ${
      isNew 
        ? 'border-amber-450 ring-2 ring-amber-450/15 bg-amber-50/5 shadow-sm' 
        : isUrgent 
        ? 'border-2 border-primary ring-2 ring-primary/10 shadow-md animate-pulse' 
        : 'border-ticket-edge bg-white'
    }`}>
      {/* Torn edge graphic */}
      <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
        ))}
      </div>

      <CardContent className="p-4 space-y-3.5">
        {/* Ticket ID & Elapsed */}
        <div className="flex justify-between items-start border-b border-dashed border-ink/15 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-ink block">{order.order_number}</span>
              {isNew && (
                <Badge variant="mustard" className="text-[8px] px-1 py-0 h-4 font-mono tracking-wider uppercase animate-pulse">
                  NEW
                </Badge>
              )}
            </div>
            <span className="text-[9px] font-mono text-ink/40 block">TABLE {order.restaurant_tables?.table_number || 'N/A'}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isUrgent ? 'text-primary font-bold' : 'text-ink/50'}`}>
              <Clock className="h-3 w-3" />
              {elapsed}m ago
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="text-[11px]">
          <span className="text-[8px] font-mono text-ink/40 block">CUSTOMER</span>
          <span className="font-bold text-ink">{order.customer_name}</span>
          {order.customer_phone && (
            <span className="text-[9px] text-ink/50 font-mono block mt-0.5">{order.customer_phone}</span>
          )}
        </div>

        {/* Order Items list */}
        <div className="space-y-2.5 pt-1.5">
          {order.order_items.map((item) => (
            <div key={item.id} className="text-xs">
              <div className="flex justify-between items-start">
                <span className="font-bold text-ink">{item.quantity}x {item.item_name_snapshot}</span>
              </div>
              
              {item.order_item_addons && item.order_item_addons.map((add) => (
                <div key={add.id} className="text-[10px] text-ink/50 font-mono pl-3">
                  + {add.addon_name_snapshot}
                </div>
              ))}

              {item.notes && (
                <div className="text-[10px] text-primary italic font-mono pl-3 mt-0.5">
                  * "{item.notes}"
                </div>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-background border border-ticket-edge p-2 rounded-lg text-[10px] italic">
            <span className="text-[8px] font-mono text-primary font-bold block uppercase">KITCHEN NOTE</span>
            <span className="text-ink/70">"{order.notes}"</span>
          </div>
        )}

        <TicketDivider />

        {/* Total Price */}
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-ink/40">Subtotal/Total</span>
          <span className="font-bold text-xs text-ink">${Number(order.total).toFixed(2)}</span>
        </div>

        {/* Action Triggers */}
        {nextStatus && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAdvance(order.id, 'cancelled')}
              className="h-8 w-8 flex-shrink-0 border border-ticket-edge rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
              title="Cancel Ticket"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Button 
              size="sm" 
              className="flex-grow text-[10px] h-8 font-mono tracking-wider font-bold uppercase gap-1"
              onClick={() => onAdvance(order.id, nextStatus)}
            >
              <Play className="h-3 w-3 fill-current" />
              {actionLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
