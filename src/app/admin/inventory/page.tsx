'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Truck, 
  RotateCcw, 
  Loader2 as Loader,
  DollarSign
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  unit: string
  current_stock: number
  min_stock_alert: number
  unit_cost: number
}

interface Supplier {
  id: string
  name: string
  contact_name: string
  phone: string
  email: string
}

export default function AdminInventoryPage() {
  const { restaurant } = useAdmin()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)
    try {
      const [invRes, supRes] = await Promise.all([
        supabase.from('inventory_items').select('*').eq('restaurant_id', restaurant.id),
        supabase.from('suppliers').select('*').eq('restaurant_id', restaurant.id)
      ])

      if (invRes.data) setItems(invRes.data as InventoryItem[])
      if (supRes.data) setSuppliers(supRes.data as Supplier[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [restaurant?.id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const lowStockCount = useMemo(() => {
    return items.filter(i => Number(i.current_stock) <= Number(i.min_stock_alert)).length
  }, [items])

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
        title="Smart Inventory & Recipe Costing"
        description="Monitor stock levels, ingredient unit costs, and supplier contacts"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Inventory' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs font-mono h-8 border-dashed">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Refresh Stock
          </Button>
        }
      />

      {/* Stock Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Tracked Ingredients</span>
              <span className="text-base font-mono font-bold text-ink">{items.length} Items</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-mustard/15 text-mustard-hover' : 'bg-sage/10 text-sage-hover'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Low Stock Alerts</span>
              <span className="text-base font-mono font-bold text-ink">{lowStockCount} Items</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-ticket-edge">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-sage/10 text-sage-hover rounded-xl flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-ink/40 block uppercase tracking-wide">Active Suppliers</span>
              <span className="text-base font-mono font-bold text-ink">{suppliers.length} Vendors</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items Ledger Table */}
      <div className="bg-white border border-ticket-edge rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dashed border-ticket-edge flex justify-between items-center">
          <h3 className="font-mono text-xs font-bold text-ink uppercase tracking-wide">Ingredient Stock Levels</h3>
          <Badge variant="mustard" className="text-[9px]">Live Ledger</Badge>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-ink/40 font-mono text-xs">
            No inventory items tracked yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-background text-ink/50 border-b border-ticket-edge uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Min Alert Threshold</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ticket-edge">
                {items.map((item) => {
                  const isLow = Number(item.current_stock) <= Number(item.min_stock_alert)
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-ink">{item.name}</td>
                      <td className="py-3 px-4">{item.current_stock} {item.unit}</td>
                      <td className="py-3 px-4 text-ink/50">{item.min_stock_alert} {item.unit}</td>
                      <td className="py-3 px-4 font-bold text-sage-hover">${Number(item.unit_cost).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <Badge variant="mustard" className="text-[9px]">LOW STOCK</Badge>
                        ) : (
                          <Badge variant="sage" className="text-[9px]">IN STOCK</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Suppliers List */}
      <div className="bg-white border border-ticket-edge rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-mono text-xs font-bold text-ink uppercase tracking-wide">Vendor & Supplier Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="p-3 rounded-lg bg-background border border-ticket-edge space-y-1">
              <span className="font-bold text-xs text-ink block">{sup.name}</span>
              <span className="text-[10px] text-ink/60 font-mono block">Contact: {sup.contact_name} ({sup.phone})</span>
              <span className="text-[10px] text-ink/40 font-mono block">{sup.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
