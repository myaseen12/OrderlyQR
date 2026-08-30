'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatCurrency } from '@/utils/currency'
import { 
  Search, 
  Filter, 
  Printer, 
  Clock, 
  User, 
  Layers, 
  X, 
  Check, 
  Loader2 as Loader,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Download
} from 'lucide-react'

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

export default function AdminOrdersManagerPage() {
  const { restaurant } = useAdmin()
  const [orders, setOrders] = useState<FullOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null)
  
  const supabase = useMemo(() => createClient(), [])

  // Load orders
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [restaurant?.id, supabase])

  useEffect(() => {
    loadOrders()
  }, [restaurant?.id, loadOrders])

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = 
        statusFilter === 'all' || 
        order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  // Update order status directly from manager
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      if (error) {
        alert(error.message)
        return
      }

      setOrders(prev => 
        prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o)
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus as any } : null)
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

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return
    const headers = ['Order Number', 'Table', 'Customer Name', 'Status', 'Total ($)', 'Date']
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.restaurant_tables?.table_number || 'N/A',
      `"${o.customer_name}"`,
      o.status,
      Number(o.total).toFixed(2),
      new Date(o.created_at).toLocaleString()
    ])
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `OrderlyQR_Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 select-none max-w-6xl">
      
      {/* Header */}
      <PageHeader
        title="Orders Ledger"
        description="Billing logs and receipt tracking ledger"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Orders Ledger' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs font-mono h-8 border-dashed gap-1 text-sage-hover">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={loadOrders} className="text-xs font-mono h-8 border-dashed">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reload Ledger
            </Button>
          </div>
        }
      />

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-ticket-edge shadow-sm">
        
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-ink/30 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search Ticket ID or Guest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <Filter className="h-4 w-4 text-ink/30 absolute left-3 top-3.5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs pl-9 pr-4 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served (Completed)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

      </div>

      {/* Double Pane content: Ledger Table & Receipt Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Ledger Table list */}
        <Card className="bg-white lg:col-span-2 overflow-hidden border border-ticket-edge shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-ticket-edge bg-background font-mono text-ink/40 font-bold">
                  <th className="p-4 uppercase tracking-wider">Ticket ID</th>
                  <th className="p-4 uppercase tracking-wider">Table</th>
                  <th className="p-4 uppercase tracking-wider">Guest</th>
                  <th className="p-4 uppercase tracking-wider">Time</th>
                  <th className="p-4 uppercase tracking-wider">Status</th>
                  <th className="p-4 uppercase tracking-wider text-right">Bill</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-ink/40 font-mono">
                      No records match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`border-b border-ticket-edge hover:bg-background/50 cursor-pointer transition-colors font-medium ${
                        selectedOrder?.id === order.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-ink">{order.order_number}</td>
                      <td className="p-4 font-mono">Table {order.restaurant_tables?.table_number || 'N/A'}</td>
                      <td className="p-4 text-ink">{order.customer_name}</td>
                      <td className="p-4 text-ink/60 font-mono">
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
                      <td className="p-2 text-ink/30">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Receipt Detail */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <Card className="bg-white border border-ticket-edge shadow-sm relative overflow-hidden">
              
              {/* Tear Edge decoration */}
              <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
                ))}
              </div>

              <CardContent className="p-5 space-y-4">
                
                {/* Close trigger */}
                <div className="flex justify-between items-center border-b border-dashed border-ink/15 pb-3">
                  <div className="font-mono">
                    <span className="text-xs font-bold text-ink block">{selectedOrder.order_number}</span>
                    <span className="text-[9px] text-ink/40 uppercase block">Receipt details</span>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="h-7 w-7 rounded-full bg-background flex items-center justify-center border text-ink/50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-ink/40 block">TABLE</span>
                    <span className="font-bold text-ink">Table {selectedOrder.restaurant_tables?.table_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-ink/40 block">TIME PLACED</span>
                    <span className="font-bold text-ink">
                      {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-ink/40 block">CUSTOMER</span>
                    <span className="font-bold text-ink flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-ink/40" />
                      {selectedOrder.customer_name}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3.5 pt-3 border-t border-stone-50">
                  <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wider">Ticket Items</span>
                  <div className="space-y-3 font-mono text-xs">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-ink">
                          <span>{item.quantity}x {item.item_name_snapshot}</span>
                          <span className="font-bold">{formatCurrency(item.price_snapshot * item.quantity)}</span>
                        </div>
                        {item.order_item_addons && item.order_item_addons.map(add => (
                          <div key={add.id} className="text-[10px] text-ink/50 pl-3">
                            + {add.addon_name_snapshot} (+{formatCurrency(add.price_snapshot)})
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {selectedOrder.notes && (
                  <div className="bg-background border border-ticket-edge p-2.5 rounded-lg text-xs italic">
                    <span className="text-[8px] font-mono text-primary font-bold block uppercase">GUEST NOTES</span>
                    <span className="text-ink/75">"{selectedOrder.notes}"</span>
                  </div>
                )}

                <TicketDivider />

                {/* Cost */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-ink/65">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink/65">
                    <span>Service Fee</span>
                    <span>{formatCurrency(400)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink text-sm pt-2 border-t border-ink/10">
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                <TicketDivider />

                {/* Status action buttons */}
                <div className="space-y-2 pt-1.5">
                  <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wider">Modify Ticket Status</span>
                  
                  <div className="flex gap-2">
                    {selectedOrder.status !== 'served' && (
                      <Button 
                        size="sm" 
                        className="flex-grow text-[10px] font-mono tracking-wider font-bold h-9 gap-1"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'served')}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark Served
                      </Button>
                    )}
                    {selectedOrder.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-[10px] font-mono tracking-wider font-bold h-9 border-dashed text-red-500 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="hidden lg:block bg-background/50 border-2 border-dashed border-ticket-edge rounded-2xl p-6 text-center select-none py-16">
              <Printer className="h-10 w-10 mx-auto text-ink/15 mb-3" />
              <h4 className="font-bold text-ink text-sm">Receipt Viewer</h4>
              <p className="text-[11px] text-ink/50 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Select an order row from the ledger to view its full receipt breakdown here.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
