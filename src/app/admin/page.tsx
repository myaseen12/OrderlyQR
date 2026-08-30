'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { askAiAssistant } from '@/utils/aiAssistant'
import { formatCurrency } from '@/utils/currency'
import { ExternalLink, Bot, Sparkles, Send } from 'lucide-react'
import { 
  Layers, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Percent,
  Plus,
  Loader2 as Loader
} from 'lucide-react'
import Link from 'next/link'

interface DashboardOrder {
  id: string
  order_number: string
  customer_name: string
  status: string
  total: number
  created_at: string
  restaurant_tables?: {
    table_number: string
  } | null
}

export default function AdminDashboardPage() {
  const { restaurant } = useAdmin()
  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!restaurant?.id) return
    const restaurantId = restaurant.id

    async function loadTodayData() {
      try {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayStartISO = todayStart.toISOString()

        // Fetch today's orders
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            status,
            total,
            created_at,
            restaurant_tables (
              table_number
            )
          `)
          .eq('restaurant_id', restaurantId)
          .gte('created_at', todayStartISO)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setOrders(data as any)
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTodayData()

    // Setup realtime subscription to listen for new orders
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          // Re-fetch when items change
          loadTodayData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurant?.id, supabase])

  // Computed statistics
  const stats = useMemo(() => {
    const totalCount = orders.length
    const pendingCount = orders.filter(o => o.status === 'pending').length
    const preparingCount = orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length
    const completedCount = orders.filter(o => o.status === 'served').length
    
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)

    return {
      totalCount,
      pendingCount,
      preparingCount,
      completedCount,
      revenue
    }
  }, [orders])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome header */}
      <PageHeader
        title="Welcome back, Chef!"
        description={`Here is what is cooking today at ${restaurant?.name || 'OrderlyQR Partner'}`}
        fallbackUrl="/"
        backLabel="Home"
        showBack={true}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin Dashboard' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {restaurant?.slug && (
              <Link href={`/menu/${restaurant.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="text-xs font-mono gap-1 border-dashed">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Menu
                </Button>
              </Link>
            )}
            <Link href="/admin/orders">
              <Button size="sm" className="text-xs font-mono gap-1">
                Open Orders Board
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* 1. STATS INDICATORS BLOCK */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Rev */}
        <Card className="bg-white col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Today's Sales</span>
              <span className="text-base font-mono font-bold">{formatCurrency(stats.revenue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 bg-ink/5 text-ink rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Total Tickets</span>
              <span className="text-base font-mono font-bold">{stats.totalCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 bg-mustard/20 text-amber-700 rounded-lg flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Pending Queue</span>
              <span className="text-base font-mono font-bold text-amber-700">{stats.pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Preparing */}
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <ChefHat className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Active Cooking</span>
              <span className="text-base font-mono font-bold text-blue-600">{stats.preparingCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Served */}
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 bg-sage/10 text-sage-hover rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Completed</span>
              <span className="text-base font-mono font-bold text-sage-hover">{stats.completedCount}</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 2. RECENT ORDERS TABLE */}
      <Card className="bg-white">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-base">Recent Sales Tickets (Today)</CardTitle>
          <CardDescription className="text-xs">Realtime orders received from table QR codes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-ink/40">
              <ShoppingBag className="h-10 w-10 mx-auto text-ink/10 mb-2" />
              <p className="text-xs font-mono">No orders placed today yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-ticket-edge bg-background font-mono text-ink/40 font-bold">
                    <th className="p-4 uppercase tracking-wider">Ticket ID</th>
                    <th className="p-4 uppercase tracking-wider">Table</th>
                    <th className="p-4 uppercase tracking-wider">Customer</th>
                    <th className="p-4 uppercase tracking-wider">Time</th>
                    <th className="p-4 uppercase tracking-wider">Status</th>
                    <th className="p-4 uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b border-ticket-edge hover:bg-background/50 font-medium">
                      <td className="p-4 font-mono font-bold text-ink">{order.order_number}</td>
                      <td className="p-4 font-mono">Table {order.restaurant_tables?.table_number || 'N/A'}</td>
                      <td className="p-4 text-ink">{order.customer_name}</td>
                      <td className="p-4 text-ink/65 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            order.status === 'pending' ? 'mustard' :
                            order.status === 'preparing' ? 'default' :
                            order.status === 'ready' ? 'sage' :
                            'secondary'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-ink">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI RESTAURANT COPILOT WIDGET */}
      <Card className="bg-white border border-ticket-edge shadow-sm overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                AI Restaurant Copilot
                <Badge variant="mustard" className="text-[8px]">Controlled</Badge>
              </h3>
              <p className="text-[10px] text-ink/50 font-mono">Ask about today's revenue, order velocity, or dish pairings</p>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!aiQuery.trim()) return
            setAiLoading(true)
            try {
              const res = await askAiAssistant(aiQuery, {
                restaurantName: restaurant?.name || 'Bistro Rustique',
                ordersCount: stats.totalCount,
                todaySales: stats.revenue,
                topItems: ['Smash Burger', 'Woodfired Pizza']
              })
              setAiResponse(res.answer)
            } finally {
              setAiLoading(false)
            }
          }} className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. How much revenue was generated today?"
              className="flex-grow text-xs font-mono px-3 py-2 border border-ticket-edge rounded-lg focus:outline-none focus:border-primary bg-background"
            />
            <Button size="sm" type="submit" disabled={aiLoading} className="text-xs font-mono gap-1">
              {aiLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Ask AI
            </Button>
          </form>

          {aiResponse && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs font-mono leading-relaxed text-ink flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{aiResponse}</span>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
