'use client'

import React, { useState, useEffect, useMemo, useCallback, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { BackButton } from '@/components/ui/BackButton'
import { formatCurrency } from '@/utils/currency'
import { 
  Check, 
  Loader2 as Loader, 
  AlertTriangle,
  Clock,
  Compass,
  UtensilsCrossed,
  ChefHat,
  ChevronLeft,
  XCircle,
  HelpCircle,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { submitOrderFeedbackAction } from '@/app/menu/actions'

interface OrderAddon {
  addon_name_snapshot: string
  price_snapshot: number
}

interface OrderItem {
  id: string
  item_name_snapshot: string
  price_snapshot: number
  quantity: number
  order_item_addons?: OrderAddon[]
}

interface OrderDetails {
  id: string
  restaurant_id: string
  order_number: string
  customer_name: string
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled'
  subtotal: number
  total: number
  notes?: string
  created_at: string
  restaurants?: {
    name: string
    logo: string
    slug: string
  } | null
  restaurant_tables?: {
    table_number: string
  } | null
  order_items: OrderItem[]
}

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [rating, setRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order?.id || !order?.restaurant_id) return
    setSubmittingFeedback(true)
    try {
      const res = await submitOrderFeedbackAction(order.id, order.restaurant_id, rating, feedbackComment)
      if (res.success) {
        setFeedbackSubmitted(true)
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const supabase = useMemo(() => createClient(), [])

  // Load Order details
  const loadOrderDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          restaurant_id,
          order_number,
          customer_name,
          status,
          subtotal,
          total,
          notes,
          created_at,
          restaurants (
            name,
            logo,
            slug
          ),
          restaurant_tables (
            table_number
          ),
          order_items (
            id,
            item_name_snapshot,
            price_snapshot,
            quantity,
            order_item_addons (
              addon_name_snapshot,
              price_snapshot
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        setErrorMsg('Order ticket not found or invalid.')
        return
      }

      setOrder(data as any)
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to retrieve order tracking.')
    } finally {
      setLoading(false)
    }
  }, [orderId, supabase])

  useEffect(() => {
    loadOrderDetails()

    // Subscribe to realtime updates on this specific order
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          const nextStatus = payload.new.status
          setOrder(prev => prev ? { ...prev, status: nextStatus } : null)

          // Spark celebrations
          if (nextStatus === 'ready') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
          } else if (nextStatus === 'served') {
            confetti({ particleCount: 30, spread: 35, colors: ['#81B29A', '#FAF8F5'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // Status timeline definition
  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: Clock },
    { key: 'accepted', label: 'Accepted', icon: Compass },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready for Pickup', icon: UtensilsCrossed },
    { key: 'served', label: 'Served', icon: Check }
  ]

  // Find active step index
  const activeStepIdx = useMemo(() => {
    if (!order) return -1
    if (order.status === 'cancelled') return -1
    
    // Treat 'accepted' and 'preparing' as active preparing indices
    if (order.status === 'accepted') return 1
    return statusSteps.findIndex(step => step.key === order.status)
  }, [order, statusSteps])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <Loader className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs font-mono mt-2 text-ink/40">Loading Tracking Status...</span>
      </div>
    )
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-ink">Ticket Error</h3>
        <p className="text-xs text-ink/50 mt-1 max-w-[280px] leading-relaxed">{errorMsg || 'Order not found'}</p>
        
        <Link href="/" className="mt-6">
          <Button variant="outline" size="sm" className="text-xs font-mono gap-1 border-dashed">
            <ChevronLeft className="h-4 w-4" />
            Platform Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-ink font-sans flex flex-col items-center p-4 pb-16">
      
      {/* Brand Header */}
      <header className="w-full max-w-md text-center py-6 select-none flex flex-col items-center relative">
        <BackButton 
          fallbackUrl={order.restaurants?.slug ? `/menu/${order.restaurants.slug}` : '/'} 
          label="Menu" 
          className="absolute top-6 left-0" 
        />

        <div className="h-11 w-11 bg-white border border-ticket-edge rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-2">
          {order.restaurants?.logo || '🪵'}
        </div>
        <h2 className="font-bold text-sm tracking-tight text-ink">{order.restaurants?.name}</h2>
        <span className="text-[9px] font-mono text-ink/40 uppercase tracking-widest block mt-0.5">Order Tracking</span>
      </header>

      {/* Main ticket */}
      <div className="w-full max-w-md">
        <Card className="bg-white overflow-hidden border border-ticket-edge shadow-md relative">
          
          {/* Tear notch decoration */}
          <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
            ))}
          </div>

          <CardContent className="p-6 space-y-6">
            
            {/* Monospace receipt ID & table */}
            <div className="flex justify-between items-start border-b border-dashed border-ink/15 pb-4">
              <div>
                <h1 className="font-mono text-base font-bold text-ink">TICKET {order.order_number}</h1>
                <span className="text-[10px] font-mono text-ink/40 uppercase block mt-0.5">
                  {order.restaurant_tables ? `TABLE ${order.restaurant_tables.table_number}` : 'TAKEOUT'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[8px] font-mono text-ink/40 block">TIME PLACED</span>
                <span className="font-mono text-xs font-semibold text-ink">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* CASE A: Cancelled State */}
            {order.status === 'cancelled' ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-red-700 text-xs">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold">Order Ticket Cancelled</h4>
                  <p className="text-red-650 leading-relaxed">
                    This order was cancelled by the kitchen staff. Please request assistance from restaurant personnel.
                  </p>
                </div>
              </div>
            ) : (
              /* CASE B: Timeline status steps */
              <div className="space-y-5">
                <span className="text-[8px] font-mono text-ink/40 block uppercase tracking-wider">Live Cooking Progress</span>
                
                <div className="space-y-4">
                  {statusSteps.map((step, idx) => {
                    const Icon = step.icon
                    const isCompleted = idx < activeStepIdx
                    const isActive = idx === activeStepIdx
                    
                    return (
                      <div key={step.key} className="flex items-center gap-4 text-xs font-semibold font-mono select-none">
                        
                        {/* Dot / Check status indicator */}
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                          isCompleted 
                            ? 'bg-sage/10 border-sage/30 text-sage-hover' 
                            : isActive 
                            ? 'bg-primary text-white border-primary animate-pulse' 
                            : 'bg-background border-ticket-edge text-ink/30'
                        }`}>
                          {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
                        </div>

                        {/* Label */}
                        <span className={isCompleted ? 'text-sage-hover line-through opacity-70' : isActive ? 'text-ink font-bold' : 'text-ink/40'}>
                          {step.label}
                        </span>

                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <TicketDivider />

            {/* Order Items receipt block */}
            <div className="space-y-3.5">
              <span className="text-[8px] font-mono text-ink/40 block uppercase tracking-wider">Receipt Invoice</span>
              
              <div className="space-y-3 font-mono text-xs">
                {order.order_items.map((oi) => (
                  <div key={oi.id} className="space-y-1">
                    <div className="flex justify-between text-ink">
                      <span>{oi.quantity}x {oi.item_name_snapshot}</span>
                      <span className="font-bold">{formatCurrency(oi.price_snapshot * oi.quantity)}</span>
                    </div>

                    {oi.order_item_addons && oi.order_item_addons.map((add, aIdx) => (
                      <div key={aIdx} className="text-[10px] text-ink/50 pl-3">
                        + {add.addon_name_snapshot} (+{formatCurrency(add.price_snapshot)})
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <TicketDivider />

            {/* Total summary */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-ink/65">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/65">
                <span>Service Fee</span>
                <span>{formatCurrency(400)}</span>
              </div>
              <div className="flex justify-between font-bold text-ink text-sm pt-2 border-t border-ink/10">
                <span>Total Bill</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Guest info banner */}
            <div className="bg-background border border-ticket-edge p-3 rounded-lg text-[10px] font-mono text-ink/60 flex items-center justify-between">
              <span>Customer: {order.customer_name}</span>
              <Badge variant="secondary" className="text-[8px]">Dine-In</Badge>
            </div>

            {/* 5-Star Feedback Form when Served */}
            {order.status === 'served' && (
              <div className="pt-3 border-t border-dashed border-ink/15 space-y-3">
                <span className="text-[8px] font-mono text-ink/40 block uppercase tracking-wider">How was your meal?</span>
                
                {feedbackSubmitted ? (
                  <div className="bg-sage/10 border border-sage/30 p-3 rounded-xl text-center space-y-1">
                    <span className="text-xs font-bold text-sage-hover block font-mono">Thank you for your feedback! ⭐</span>
                    <span className="text-[10px] text-ink/60">Your rating helps us improve our dining service.</span>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                    <div className="flex gap-1 justify-center py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`h-6 w-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Optional comments about food or service..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    />
                    <Button type="submit" size="sm" disabled={submittingFeedback} className="w-full text-xs font-mono h-8">
                      {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                  </form>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Back button */}
      {order.restaurants && (
        <Link href={`/menu/${order.restaurants.slug}`}>
          <Button variant="outline" size="sm" className="mt-8 text-xs font-mono gap-1 border-dashed">
            <ChevronLeft className="h-4 w-4" />
            Back to Menu
          </Button>
        </Link>
      )}

    </div>
  )
}
