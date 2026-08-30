'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  MOCK_RESTAURANT, 
  MOCK_TABLES, 
  MOCK_CATEGORIES, 
  MOCK_MENU_ITEMS, 
  MenuItem, 
  AddonItem,
  Order,
  OrderStatus
} from '@/data/mockData'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { BackButton } from '@/components/ui/BackButton'
import { formatCurrency } from '@/utils/currency'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChefHat, 
  Check, 
  MessageSquare, 
  User, 
  Phone,
  Clock,
  ChevronRight,
  Search,
  Home,
  Star,
  SlidersHorizontal,
  Sparkles,
  Flame,
  ArrowRight,
  UtensilsCrossed
} from 'lucide-react'

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  selectedAddons: {
    groupName: string
    addon: AddonItem
  }[]
  notes: string
}

export default function CustomerMenuPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  const tableId = params.tableId as string

  const currentTable = useMemo(() => {
    return MOCK_TABLES.find(t => t.id === tableId) || MOCK_TABLES[0]
  }, [tableId])

  const restaurant = MOCK_RESTAURANT

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recommended' | 'popular' | 'price_low' | 'price_high'>('recommended')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null)
  
  // Modal addon selection state
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalSelectedAddons, setModalSelectedAddons] = useState<{groupName: string; addon: AddonItem}[]>([])
  const [modalNotes, setModalNotes] = useState('')

  // Checkout info
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'card' | 'cash'>('easypaisa')

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  // Undo Toast state
  const [lastRemovedItem, setLastRemovedItem] = useState<{ item: CartItem; index: number } | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)

  // Placed Order state
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter & Sort menu items
  const filteredMenuItems = useMemo(() => {
    let result = [...MOCK_MENU_ITEMS]

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category_id === selectedCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'price_low') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.addons ? 1 : 0) - (a.addons ? 1 : 0))
    }

    return result
  }, [selectedCategory, searchQuery, sortBy])

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const addonsPrice = item.selectedAddons.reduce((aSum, a) => aSum + Number(a.addon.price), 0)
      return sum + (Number(item.menuItem.price) + addonsPrice) * item.quantity
    }, 0)
  }, [cart])

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Open item modal
  const handleOpenItemModal = (item: MenuItem) => {
    setSelectedItemForModal(item)
    setModalQuantity(1)
    setModalSelectedAddons([])
    setModalNotes('')
  }

  // Quick direct add item to cart
  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const cartEntryId = `${item.id}--`
    setCart(prev => {
      const existing = prev.find(i => i.id === cartEntryId)
      if (existing) {
        return prev.map(i => i.id === cartEntryId ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id: cartEntryId, menuItem: item, quantity: 1, selectedAddons: [], notes: '' }]
    })
  }

  // Quick decrease quantity from menu card
  const handleQuickDecrease = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const cartEntryId = `${item.id}--`
    setCart(prev => {
      return prev.map(i => {
        if (i.id === cartEntryId) {
          const newQty = i.quantity - 1
          return newQty > 0 ? { ...i, quantity: newQty } : null
        }
        return i
      }).filter(Boolean) as CartItem[]
    })
  }

  // Addon toggle in modal
  const handleToggleAddon = (groupName: string, addon: AddonItem, maxSelection: number) => {
    setModalSelectedAddons(prev => {
      const groupAddons = prev.filter(a => a.groupName === groupName)
      const exists = prev.some(a => a.addon.id === addon.id)
      if (exists) {
        return prev.filter(a => a.addon.id !== addon.id)
      }
      if (groupAddons.length >= maxSelection) {
        if (maxSelection === 1) {
          const filtered = prev.filter(a => a.groupName !== groupName)
          return [...filtered, { groupName, addon }]
        }
        return prev
      }
      return [...prev, { groupName, addon }]
    })
  }

  // Add to cart from modal
  const handleAddToCartFromModal = () => {
    if (!selectedItemForModal) return
    const addonIds = modalSelectedAddons.map(a => a.addon.id).sort().join('-')
    const cartEntryId = `${selectedItemForModal.id}-${addonIds}-${modalNotes}`

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartEntryId)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += modalQuantity
        return updated
      }
      return [...prev, {
        id: cartEntryId,
        menuItem: selectedItemForModal,
        quantity: modalQuantity,
        selectedAddons: modalSelectedAddons,
        notes: modalNotes
      }]
    })

    setSelectedItemForModal(null)
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.9 } })
  }

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const targetItem = prev.find(item => item.id === id)
      if (!targetItem) return prev

      const newQty = targetItem.quantity + delta
      if (newQty <= 0) {
        // Trigger undo toast
        const index = prev.findIndex(item => item.id === id)
        setLastRemovedItem({ item: targetItem, index })
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 4000)

        return prev.filter(item => item.id !== id)
      }

      return prev.map(item => item.id === id ? { ...item, quantity: newQty } : item)
    })
  }

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id)
      if (index > -1) {
        setLastRemovedItem({ item: prev[index], index })
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 4000)
      }
      return prev.filter(item => item.id !== id)
    })
  }

  const handleUndoRemove = () => {
    if (!lastRemovedItem) return
    setCart(prev => {
      const updated = [...prev]
      updated.splice(lastRemovedItem.index, 0, lastRemovedItem.item)
      return updated
    })
    setLastRemovedItem(null)
    setShowUndoToast(false)
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const code = couponInput.trim().toUpperCase()
    if (!code) return

    setIsValidatingCoupon(true)
    setCouponMsg('')

    // Client/Server coupon calculation logic
    if (code === 'WELCOME10') {
      const disc = Math.round(cartSubtotal * 0.10)
      setAppliedDiscount({ code, amount: disc })
      setCouponMsg('Promo code WELCOME10 applied! 10% discount subtracted.')
    } else if (code === 'RUSTIQUE15') {
      const disc = Math.round(cartSubtotal * 0.15)
      setAppliedDiscount({ code, amount: disc })
      setCouponMsg('Promo code RUSTIQUE15 applied! 15% discount subtracted.')
    } else if (code === 'SAVE500') {
      setAppliedDiscount({ code, amount: 500 })
      setCouponMsg('Promo code SAVE500 applied! PKR 500 discount subtracted.')
    } else {
      setCouponMsg('Invalid coupon code. Try WELCOME10, RUSTIQUE15, or SAVE500.')
    }
    setIsValidatingCoupon(false)
  }

  // Submit Order flow with real Payment Gateway integration
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    setIsSubmitting(true)

    try {
      const payload = {
        restaurantId: restaurant.id,
        tableId: currentTable.id,
        cartItems: cart.map(c => ({
          itemId: c.menuItem.id,
          quantity: c.quantity,
          selectedAddons: c.selectedAddons.map(a => ({ name: a.addon.name, price: Number(a.addon.price) }))
        })),
        customerDetails: {
          name: customerName || `Guest Table ${currentTable.table_number}`,
          phone: customerPhone || '',
          notes: orderNotes || ''
        },
        couponDiscount: appliedDiscount?.amount || 0
      }

      const res = await fetch(`/api/payments/${selectedPaymentMethod}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!data.success) {
        alert(`Payment Initialization Failed: ${data.error}`)
        setIsSubmitting(false)
        return
      }

      // If redirect URL or postData returned for online gateway (EasyPaisa/JazzCash/Card)
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      if (data.postData && data.gatewayUrl) {
        // Auto-submit POST form for gateway
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.gatewayUrl
        for (const [key, value] of Object.entries(data.postData)) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
      }

      // For cash orders or instant confirmations
      setCart([])
      setIsCartOpen(false)
      window.location.href = `/payment/status?status=PAID&orderId=${data.orderId}&ref=${data.merchantReference}`

    } catch (err: any) {
      alert(`Payment Processing Error: ${err.message || err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const simulateKitchenProgress = () => {
    if (!placedOrder) return
    const statuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'served']
    const currentIndex = statuses.indexOf(placedOrder.status)
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1]
      setPlacedOrder(prev => prev ? { ...prev, status: nextStatus, updated_at: new Date().toISOString() } : null)
      if (nextStatus === 'ready') confetti({ particleCount: 40, spread: 60 })
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink font-sans flex flex-col items-center pb-28 select-none">
      
      {/* 1. TOP STICKY NAVIGATION HEADER */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-ticket-edge sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back & Home buttons */}
          <div className="flex items-center gap-2">
            <BackButton fallbackUrl="/" label="Back" />
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ticket-edge bg-white text-xs font-mono font-bold text-ink/75 hover:text-ink hover:border-primary/40 transition-all shadow-sm"
              title="Return to Home"
            >
              <Home className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>

          {/* Center: Restaurant Brand */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg border border-primary/20 shrink-0">
              {restaurant.logo}
            </div>
            <div className="text-left">
              <h1 className="font-bold text-sm text-ink truncate max-w-[140px] sm:max-w-[220px]">{restaurant.name}</h1>
              <span className="text-[9px] font-mono text-sage-hover font-bold block">● Open Now</span>
            </div>
          </div>

          {/* Right: Cart Button trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-ink text-white hover:bg-ink/90 transition-all flex items-center gap-2 text-xs font-mono font-bold shadow-sm active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartTotalItems > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center -ml-0.5">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN CONTAINER (Responsive Max-Width 1200px - 1400px) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* RESTAURANT HERO BANNER */}
        <div className="relative rounded-2xl overflow-hidden border border-ticket-edge bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Open Now (12:00 PM – 11:00 PM)
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-300 stroke-none" />
                  4.8 (340+ Reviews)
                </span>
                <span className="bg-white/10 text-white border border-white/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                  Table {currentTable.table_number}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">{restaurant.name}</h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans max-w-xl">
                {restaurant.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-inner">
                {restaurant.logo}
              </div>
            </div>
          </div>
        </div>

        {/* PLACED ORDER STATUS TRACKER OR MAIN MENU LAYOUT */}
        {placedOrder ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <Card className="overflow-hidden border-2 border-dashed border-primary/30 shadow-md">
              <div className="bg-primary/5 p-6 text-center border-b border-dashed border-ticket-edge">
                <ChefHat className="mx-auto text-primary h-10 w-10 mb-2" />
                <h3 className="font-bold text-lg text-ink">Ticket Sent to Kitchen!</h3>
                <p className="text-xs text-ink/60 mt-1">Keep this page open to track your meal preparation in real-time.</p>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-ticket-edge font-mono">
                  <div>
                    <span className="text-[10px] text-ink/40 block">TICKET ID</span>
                    <span className="font-bold text-ink text-sm">{placedOrder.order_number}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-ink/40 block">TABLE</span>
                    <span className="font-bold text-ink text-sm">Table {placedOrder.table?.table_number}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-ink/40 block uppercase tracking-wide">LIVE KITCHEN STATUS</span>
                  <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-ticket-edge">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                      {placedOrder.status === 'pending' && <Clock className="h-5 w-5 animate-pulse" />}
                      {placedOrder.status === 'preparing' && <ChefHat className="h-5 w-5 animate-spin" />}
                      {placedOrder.status === 'ready' && '🎉'}
                      {placedOrder.status === 'served' && <Check className="h-5 w-5 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink capitalize">{placedOrder.status}</h4>
                      <p className="text-xs text-ink/60 mt-0.5">Chef is preparing your order for Table {currentTable.table_number}.</p>
                    </div>
                  </div>
                </div>

                <TicketDivider />

                <div className="space-y-2 font-mono text-xs">
                  {placedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{item.quantity}x {item.item_name_snapshot}</span>
                      <span className="font-bold">{formatCurrency(item.price_snapshot * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-ticket-edge text-ink">
                    <span>Total</span>
                    <span>{formatCurrency(placedOrder.total)}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button size="sm" onClick={simulateKitchenProgress} className="flex-1 text-xs font-mono">
                    Advance Status
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPlacedOrder(null)} className="flex-1 text-xs font-mono border-dashed">
                    Place Another Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* DESKTOP 2-COLUMN LAYOUT / MOBILE GRID LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* DESKTOP SIDEBAR (3 Cols on lg+) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
              
              {/* Category Navigation Panel */}
              <div className="bg-white border border-ticket-edge rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="font-mono text-xs font-bold uppercase text-ink/40 tracking-wider">Menu Categories</h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                      selectedCategory === 'all' 
                        ? 'bg-ink text-white shadow-sm' 
                        : 'text-ink/75 hover:bg-stone-100 hover:text-ink'
                    }`}
                  >
                    <span>All Items</span>
                    <Badge variant="secondary" className="text-[9px]">{MOCK_MENU_ITEMS.length}</Badge>
                  </button>

                  {MOCK_CATEGORIES.map(cat => {
                    const count = MOCK_MENU_ITEMS.filter(i => i.category_id === cat.id).length
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                          selectedCategory === cat.id 
                            ? 'bg-ink text-white shadow-sm' 
                            : 'text-ink/75 hover:bg-stone-100 hover:text-ink'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <Badge variant="secondary" className="text-[9px]">{count}</Badge>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Promo Banner Widget */}
              <div className="bg-gradient-to-br from-amber-500/10 to-primary/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-primary" /> Chef Special
                </span>
                <h4 className="font-bold text-xs text-ink">Free Appetizer Combo</h4>
                <p className="text-[11px] text-ink/65 leading-relaxed">Add any 2 Artisan Pizzas to unlock complimentary Truffle Fries!</p>
              </div>

            </aside>

            {/* MAIN CONTENT AREA (9 Cols on lg+) */}
            <main className="lg:col-span-9 space-y-6">
              
              {/* SEARCH & SORT CONTROL BAR */}
              <div className="bg-white border border-ticket-edge rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="h-4 w-4 text-ink/40 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full text-xs font-mono pl-10 pr-4 h-10 rounded-xl border border-ticket-edge bg-background focus:outline-none focus:border-primary"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-ink/40 hover:text-ink">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-background border border-ticket-edge text-xs font-mono font-bold text-ink rounded-xl px-3 h-10 focus:outline-none cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>

              </div>

              {/* MOBILE CATEGORY SCROLL PILLS (Hidden on lg+) */}
              <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 text-xs font-mono font-semibold px-4 py-2 rounded-full border transition-all ${
                    selectedCategory === 'all' ? 'bg-ink text-white border-ink shadow-sm' : 'bg-white text-ink/75 border-ticket-edge'
                  }`}
                >
                  All Items
                </button>
                {MOCK_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 text-xs font-mono font-semibold px-4 py-2 rounded-full border transition-all ${
                      selectedCategory === cat.id ? 'bg-ink text-white border-ink shadow-sm' : 'bg-white text-ink/75 border-ticket-edge'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* DISH CARDS RESPONSIVE GRID (1 Col on Mobile, 2 Cols on Tablet/Desktop) */}
              {filteredMenuItems.length === 0 ? (
                <div className="bg-white border border-ticket-edge rounded-2xl p-12 text-center text-ink/40 space-y-2">
                  <UtensilsCrossed className="h-10 w-10 mx-auto text-ink/20" />
                  <h3 className="font-bold text-sm text-ink">No Dishes Found</h3>
                  <p className="text-xs font-mono">Try adjusting your search query or switching categories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filteredMenuItems.map((item) => {
                    // Check if item is already in cart for quick quantity display
                    const cartEntry = cart.find(c => c.menuItem.id === item.id)
                    const qtyInCart = cartEntry ? cartEntry.quantity : 0

                    return (
                      <Card 
                        key={item.id}
                        className="bg-white border border-ticket-edge rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        onClick={() => handleOpenItemModal(item)}
                      >
                        <CardContent className="p-5 flex gap-4">
                          
                          {/* Dish Image / Icon Container */}
                          <div className="h-20 w-20 sm:h-24 sm:w-24 bg-background border border-ticket-edge rounded-xl flex items-center justify-center text-4xl sm:text-5xl shrink-0">
                            {item.image_url}
                          </div>

                          {/* Details */}
                          <div className="flex-grow flex flex-col justify-between min-w-0 space-y-2">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-ink truncate">{item.name}</h3>
                                <span className="font-mono font-bold text-primary text-sm sm:text-base shrink-0">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                              <p className="text-xs text-ink/60 line-clamp-2 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            {/* Badges & Add Button Row */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.addons && (
                                  <Badge variant="secondary" className="text-[8px] font-mono">CUSTOMIZABLE</Badge>
                                )}
                              </div>

                              {/* Add Button or Inline Quantity Selector */}
                              {qtyInCart > 0 ? (
                                <div 
                                  className="inline-flex items-center border border-primary/30 bg-primary/5 rounded-lg h-8 px-1 gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => handleQuickDecrease(item, e)}
                                    className="h-6 w-6 rounded bg-white text-primary flex items-center justify-center border border-primary/20 shadow-xs"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono font-bold text-xs text-primary">{qtyInCart}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleQuickAdd(item, e)}
                                    className="h-6 w-6 rounded bg-white text-primary flex items-center justify-center border border-primary/20 shadow-xs"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs font-mono font-bold text-primary border-primary/30 hover:bg-primary hover:text-white gap-1 rounded-lg transition-all"
                                  onClick={(e) => handleQuickAdd(item, e)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>

                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

            </main>

          </div>
        )}

      </div>

      {/* 3. STICKY FLOATING CART BAR */}
      {cart.length > 0 && !placedOrder && (
        <motion.div 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-30 pointer-events-none flex justify-end"
        >
          <div className="w-full sm:max-w-md pointer-events-auto">
            <Button 
              className="w-full flex justify-between items-center h-14 shadow-2xl rounded-2xl px-6 font-mono bg-ink text-white hover:bg-ink/95 border border-white/10"
              onClick={() => setIsCartOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {cartTotalItems}
                </div>
                <span className="text-xs uppercase font-sans font-bold tracking-wider">View Ticket Cart</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>{formatCurrency(cartSubtotal)}</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </Button>
          </div>
        </motion.div>
      )}

      {/* 4. ITEM CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {selectedItemForModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setSelectedItemForModal(null)}
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl sm:rounded-3xl z-50 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-ticket-edge"
            >
              <div className="p-5 border-b border-ticket-edge flex justify-between items-center">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink/50">Dish Customization</h3>
                <button onClick={() => setSelectedItemForModal(null)} className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-ticket-edge">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6 flex-grow">
                <div className="flex gap-4 items-start">
                  <div className="h-20 w-20 bg-background rounded-2xl flex items-center justify-center text-4xl border border-ticket-edge shrink-0">
                    {selectedItemForModal.image_url}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-ink">{selectedItemForModal.name}</h3>
                    <p className="text-sm font-mono font-bold text-primary mt-0.5">{formatCurrency(selectedItemForModal.price)}</p>
                  </div>
                </div>

                <p className="text-xs text-ink/70 leading-relaxed bg-background p-4 rounded-xl border border-ticket-edge">
                  {selectedItemForModal.description}
                </p>

                {selectedItemForModal.addons && selectedItemForModal.addons.map(group => (
                  <div key={group.id} className="space-y-3 border-t border-ticket-edge pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wide">{group.name}</h4>
                      <Badge variant="secondary" className="text-[9px]">
                        {group.min_selection > 0 ? `Required: ${group.min_selection}` : 'Optional'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {group.items.map(addon => {
                        const isSelected = modalSelectedAddons.some(a => a.addon.id === addon.id)
                        return (
                          <button
                            key={addon.id}
                            onClick={() => handleToggleAddon(group.name, addon, group.max_selection)}
                            className={`w-full flex justify-between items-center p-3 rounded-xl border text-xs font-mono transition-all ${
                              isSelected 
                                ? 'bg-primary/5 border-primary text-primary font-bold' 
                                : 'bg-white border-ticket-edge text-ink hover:bg-stone-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-4 w-4 rounded flex items-center justify-center border ${
                                isSelected ? 'bg-primary border-primary text-white' : 'border-ticket-edge bg-background'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </span>
                              {addon.name}
                            </span>
                            <span>+{formatCurrency(addon.price)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 border-t border-ticket-edge pt-4">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5 font-mono">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Special Kitchen Notes
                  </h4>
                  <textarea
                    placeholder="E.g., No onions, extra crispy, sauce on the side..."
                    className="w-full text-xs font-mono p-3 rounded-xl border border-ticket-edge bg-background focus:outline-none focus:border-primary min-h-[70px] resize-none"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-ticket-edge flex gap-4 bg-stone-50">
                <div className="flex items-center border border-ticket-edge bg-white rounded-xl h-11 px-2 gap-3">
                  <button 
                    disabled={modalQuantity <= 1}
                    onClick={() => setModalQuantity(q => q - 1)}
                    className="h-8 w-8 flex items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-mono font-bold text-sm w-4 text-center">{modalQuantity}</span>
                  <button 
                    onClick={() => setModalQuantity(q => q + 1)}
                    className="h-8 w-8 flex items-center justify-center text-ink/60 hover:text-ink"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button className="flex-grow gap-2 h-11 font-mono text-xs uppercase tracking-wider" onClick={handleAddToCartFromModal}>
                  Add to Ticket Cart
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. SLIDE-OVER CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 bg-white border-b border-ticket-edge flex justify-between items-center">
                <h3 className="font-bold text-ink flex items-center gap-2 text-sm uppercase tracking-wide font-mono">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Your Dining Receipt Cart
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-ticket-edge">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handlePlaceOrderSubmit} className="flex-grow overflow-y-auto flex flex-col pb-24">
                <div className="m-4 bg-white border border-ticket-edge rounded-2xl shadow-sm flex flex-col p-5 space-y-4">
                  <div className="text-center font-mono border-b border-dashed border-ticket-edge pb-4">
                    <span className="text-xs font-bold block uppercase tracking-widest text-ink">{restaurant.name}</span>
                    <span className="text-[10px] block mt-0.5 text-ink/50">TABLE {currentTable.table_number}</span>
                  </div>

                  <div className="space-y-4">
                    {cart.map((item) => {
                      const itemAddonTotal = item.selectedAddons.reduce((sum, a) => sum + Number(a.addon.price), 0)
                      const itemTotalPrice = (Number(item.menuItem.price) + itemAddonTotal) * item.quantity

                      return (
                        <div key={item.id} className="flex justify-between items-start text-xs border-b border-stone-100 pb-3 last:border-0 last:pb-0 font-mono">
                          <div className="space-y-1">
                            <div className="font-bold text-ink">{item.quantity}x {item.menuItem.name}</div>
                            {item.selectedAddons.length > 0 && (
                              <div className="text-[10px] text-ink/60 space-y-0.5 pl-2 border-l border-ticket-edge">
                                {item.selectedAddons.map((sa, idx) => (
                                  <div key={idx}>+ {sa.addon.name} (+{formatCurrency(sa.addon.price)})</div>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[10px] text-primary italic pl-2 border-l border-primary/30">
                                Notes: "{item.notes}"
                              </div>
                            )}
                            <div className="flex gap-2 pt-1.5">
                              <button 
                                type="button" 
                                className="h-6 w-6 border border-ticket-edge rounded-md bg-background flex items-center justify-center"
                                onClick={() => updateCartQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3 text-ink/60" />
                              </button>
                              <button 
                                type="button" 
                                className="h-6 w-6 border border-ticket-edge rounded-md bg-background flex items-center justify-center"
                                onClick={() => updateCartQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3 text-ink/60" />
                              </button>
                            </div>
                          </div>

                          <div className="font-bold text-ink pr-1">
                            {formatCurrency(itemTotalPrice)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <TicketDivider />

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-ink/60">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-ink/60">
                      <span>Service Fee</span>
                      <span>{formatCurrency(400)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-ink text-sm pt-2 border-t border-ticket-edge">
                      <span>Total Bill</span>
                      <span>{formatCurrency(cartSubtotal + 400)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-ticket-edge p-5 space-y-4 font-mono">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Checkout Information</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-ink/50 uppercase block">Your Name (Required)</label>
                      <div className="relative">
                        <User className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="E.g., Alex Johnson"
                          className="w-full text-xs pl-10 pr-4 h-11 rounded-xl border border-ticket-edge bg-background focus:outline-none focus:border-primary"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-ink/50 uppercase block">WhatsApp Number (Optional)</label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          placeholder="E.g., +92 300-1234567"
                          className="w-full text-xs pl-10 pr-4 h-11 rounded-xl border border-ticket-edge bg-background focus:outline-none focus:border-primary"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2 pt-2 border-t border-ticket-edge">
                      <label className="text-[10px] font-bold text-ink/50 uppercase block">Choose Payment Method</label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('easypaisa')}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all font-mono ${
                            selectedPaymentMethod === 'easypaisa'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                              : 'bg-background border-ticket-edge text-ink/75 hover:bg-stone-50'
                          }`}
                        >
                          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Wallet</span>
                          <span className="text-xs font-bold mt-1">EasyPaisa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('jazzcash')}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all font-mono ${
                            selectedPaymentMethod === 'jazzcash'
                              ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                              : 'bg-background border-ticket-edge text-ink/75 hover:bg-stone-50'
                          }`}
                        >
                          <span className="text-[10px] text-rose-600 uppercase font-bold block">Wallet</span>
                          <span className="text-xs font-bold mt-1">JazzCash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('card')}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all font-mono ${
                            selectedPaymentMethod === 'card'
                              ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-xs'
                              : 'bg-background border-ticket-edge text-ink/75 hover:bg-stone-50'
                          }`}
                        >
                          <span className="text-[10px] text-blue-600 uppercase font-bold block">Card</span>
                          <span className="text-xs font-bold mt-1">Debit / Credit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('cash')}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all font-mono ${
                            selectedPaymentMethod === 'cash'
                              ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-xs'
                              : 'bg-background border-ticket-edge text-ink/75 hover:bg-stone-50'
                          }`}
                        >
                          <span className="text-[10px] text-amber-600 uppercase font-bold block">Counter</span>
                          <span className="text-xs font-bold mt-1">Cash</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 mt-auto">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-13 text-xs font-mono font-bold uppercase tracking-wider gap-2 shadow-lg rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <ChefHat className="h-5 w-5 animate-spin" />
                        Sending Ticket...
                      </>
                    ) : (
                      <>
                        Pay {formatCurrency(cartSubtotal + 400 - (appliedDiscount?.amount || 0))} with {selectedPaymentMethod.toUpperCase()}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
