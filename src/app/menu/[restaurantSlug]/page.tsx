'use client'

import React, { useState, useEffect, useMemo, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { placeOrderAction } from '@/app/menu/actions'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { BackButton } from '@/components/ui/BackButton'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChevronRight, 
  Check, 
  Loader2 as Loader,
  AlertTriangle,
  Clock,
  Compass,
  UtensilsCrossed,
  ChefHat,
  X,
  Search,
  Globe,
  ChevronLeft
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { translations, Language } from '@/utils/i18n'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MenuItemType {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  is_available: boolean
  category_id: string
}

interface CategoryType {
  id: string
  name: string
  description?: string
}

interface CartItem {
  item: MenuItemType
  quantity: number
  notes: string
  selectedAddons: { name: string; price: number }[]
}

export default function CustomerMenuPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = use(params)
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<any | null>(null)
  const [table, setTable] = useState<any | null>(null)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [items, setItems] = useState<MenuItemType[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [lang, setLang] = useState<Language>('en')
  const t = translations[lang]
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Cart states
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'counter' | 'online'>('counter')
  
  // Customization Modal states
  const [customizingItem, setCustomizingItem] = useState<MenuItemType | null>(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([])

  // Live order tracker state
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [placedOrderStatus, setPlacedOrderStatus] = useState<string>('')
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>('')

  const supabase = useMemo(() => createClient(), [])

  const totalItemsInCart = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0)
  }, [cart])

  // Retrieve table token from URL query params
  const [tableToken, setTableToken] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setTableToken(params.get('table'))
    }
  }, [])

  // Sync cart state with localStorage
  useEffect(() => {
    if (!restaurantSlug) return
    const saved = localStorage.getItem(`orderly_qr_cart_${restaurantSlug}`)
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (e) {
        console.error('Error restoring cart:', e)
      }
    }
  }, [restaurantSlug])

  useEffect(() => {
    if (!restaurantSlug) return
    if (cart.length > 0) {
      localStorage.setItem(`orderly_qr_cart_${restaurantSlug}`, JSON.stringify(cart))
    } else {
      localStorage.removeItem(`orderly_qr_cart_${restaurantSlug}`)
    }
  }, [cart, restaurantSlug])

  // Update item quantity or delete from drawer
  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter((_, idx) => idx !== index))
      return
    }
    setCart(prev => prev.map((item, idx) => idx === index ? { ...item, quantity: newQty } : item))
  }

  // Load Menu Catalog
  useEffect(() => {
    if (!restaurantSlug) return

    async function loadCatalog() {
      try {
        // 1. Fetch restaurant info
        const { data: restData, error: restErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', restaurantSlug)
          .single()

        if (restErr || !restData) {
          setErrorMsg('Restaurant not found.')
          setLoading(false)
          return
        }
        setRestaurant(restData)

        // 2. Fetch table details if token is scanned
        if (tableToken) {
          const { data: tableData, error: tableErr } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('qr_token', tableToken)
            .eq('restaurant_id', restData.id)
            .maybeSingle()

          if (tableErr || !tableData) {
            setErrorMsg('Invalid QR Scan. Table token is expired or invalid.')
            setLoading(false)
            return
          }

          if (!tableData.is_active) {
            setErrorMsg('This dining table is currently deactivated by staff.')
            setLoading(false)
            return
          }

          setTable(tableData)
        }

        // 3. Fetch active categories
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, description')
          .eq('restaurant_id', restData.id)
          .eq('is_active', true)
          .order('sort_order')

        if (catData) {
          setCategories(catData)
          if (catData.length > 0) {
            setActiveCategory(catData[0].id)
          }
        }

        // 4. Fetch menu items (load all available & unavailable items)
        const { data: itemData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restData.id)
          .order('sort_order')

        if (itemData) {
          setItems(itemData)
        }

      } catch (err) {
        console.error(err)
        setErrorMsg('Failed to initialize ordering menu.')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [restaurantSlug, tableToken])

  // Filter items dynamically based on category and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = 
        searchTerm.trim() !== '' ||
        item.category_id === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, activeCategory])

  // Setup Realtime status listener when order is placed
  useEffect(() => {
    if (!placedOrderId) return

    const channel = supabase
      .channel(`customer-order-${placedOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${placedOrderId}`
        },
        (payload: any) => {
          const nextStatus = payload.new.status
          setPlacedOrderStatus(nextStatus)

          // Spark celebrations
          if (nextStatus === 'ready') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
          } else if (nextStatus === 'served') {
            confetti({ particleCount: 30, spread: 35, colors: ['#81B29A', '#FAF8F5'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [placedOrderId, supabase])

  // Add Item to cart
  const handleOpenCustomization = (item: MenuItemType) => {
    setCustomizingItem(item)
    setItemQuantity(1)
    setItemNotes('')
    setSelectedAddons([])
  }

  const handleAddToCart = () => {
    if (!customizingItem) return

    setCart(prev => [
      ...prev,
      {
        item: customizingItem,
        quantity: itemQuantity,
        notes: itemNotes,
        selectedAddons
      }
    ])
    setCustomizingItem(null)
    setCartOpen(true)
  }

  // Cost calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const addonsPrice = item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0)
      return sum + (item.item.price + addonsPrice) * item.quantity
    }, 0)
    
    const serviceFee = subtotal > 0 ? 1.50 : 0
    const total = subtotal + serviceFee

    return { subtotal, serviceFee, total }
  }, [cart])

  // Submit Guest Order to Supabase (via secure Server Action)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id || cart.length === 0) return

    setSubmittingOrder(true)

    try {
      const cartInputs = cart.map(item => ({
        itemId: item.item.id,
        quantity: item.quantity,
        notes: item.notes,
        selectedAddons: item.selectedAddons
      }))

      const res = await placeOrderAction(
        restaurant.id,
        table?.id || null,
        cartInputs,
        {
          name: customerName,
          phone: customerPhone,
          notes: orderNotes,
          paymentMethod
        }
      )

      if (res.success && res.orderId) {
        setCart([])
        localStorage.removeItem(`orderly_qr_cart_${restaurantSlug}`)
        setCartOpen(false)
        
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        
        // Redirect to tracking page
        router.push(`/order/${res.orderId}`)
      } else {
        alert(res.error || 'Failed to place order.')
      }
    } catch (err: any) {
      alert(`Order placement failed: ${err.message || err}`)
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <Loader className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs font-mono mt-2 text-ink/40">Loading Menu Catalog...</span>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-ink">Scan Access Error</h3>
        <p className="text-xs text-ink/50 mt-1 max-w-[280px] leading-relaxed">{errorMsg}</p>
        <span className="text-[10px] font-mono text-primary mt-4 font-bold uppercase tracking-wider block">OrderlyQR</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-ink font-sans flex flex-col items-center pb-28 select-none" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
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
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>

          {/* Center: Restaurant Brand */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg border border-primary/20 shrink-0">
              {restaurant?.logo || '🪵'}
            </div>
            <div className="text-left">
              <h1 className="font-bold text-sm text-ink truncate max-w-[140px] sm:max-w-[220px]">{restaurant?.name || 'OrderlyQR Partner'}</h1>
              <span className="text-[9px] font-mono text-sage-hover font-bold block">● Open Now</span>
            </div>
          </div>

          {/* Right: Language Switcher & Cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-ticket-edge bg-background text-ink/70 hover:text-ink flex items-center gap-1 transition-all"
              title="Switch Language"
            >
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl bg-ink text-white hover:bg-ink/90 transition-all flex items-center gap-2 text-xs font-mono font-bold shadow-sm active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalItemsInCart > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center -ml-0.5">
                  {totalItemsInCart}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN RESPONSIVE CONTAINER (1200px - 1400px) */}
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
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                  ★ 4.8 Rating
                </span>
                {table ? (
                  <span className="bg-white/10 text-white border border-white/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                    Table {table.table_number}
                  </span>
                ) : (
                  <span className="bg-white/10 text-white border border-white/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                    Dine-In Menu Preview
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">{restaurant?.name}</h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans max-w-xl">
                {restaurant?.description || 'Artisanal woodfired pizzas, premium cuts, and handcrafted cocktails in a warm, cozy setting.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-inner">
                {restaurant?.logo || '🪵'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Order Tracker Banner */}
        {placedOrderId && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border-2 border-dashed border-primary/20 overflow-hidden shadow-md">
              <CardContent className="p-5 flex gap-4">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-ink block">TICKET {placedOrderNumber}</span>
                    <Badge variant={placedOrderStatus === 'pending' ? 'mustard' : 'sage'}>
                      {placedOrderStatus}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-ink/65 font-mono mt-1 leading-relaxed">
                    Live preparation status updated by kitchen staff.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DESKTOP 2-COLUMN LAYOUT / MOBILE GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP SIDEBAR (3 Cols on lg+) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
            
            {/* Category Sidebar Navigation */}
            <div className="bg-white border border-ticket-edge rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase text-ink/40 tracking-wider">Menu Categories</h3>
              <nav className="space-y-1">
                {categories.map(cat => {
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                        isActive 
                          ? 'bg-ink text-white shadow-sm' 
                          : 'text-ink/75 hover:bg-stone-100 hover:text-ink'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

          </aside>

          {/* MAIN CATALOG CONTENT AREA (9 Cols on lg+) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* SEARCH & SORT CONTROL BAR */}
            <div className="bg-white border border-ticket-edge rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="h-4 w-4 text-ink/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs font-mono pl-10 pr-4 h-10 rounded-xl border border-ticket-edge bg-background focus:outline-none focus:border-primary"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-ink/40 hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* MOBILE CATEGORY SCROLL PILLS (Hidden on lg+) */}
            {searchTerm.trim() === '' && (
              <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                {categories.map(cat => {
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex-shrink-0 text-xs font-mono font-semibold px-4 py-2 rounded-full border transition-all ${
                        isActive 
                          ? 'bg-ink text-white border-ink shadow-sm' 
                          : 'bg-white text-ink/65 border-ticket-edge'
                      }`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Case A: Active Search matches */}
            {searchTerm.trim() !== '' && (
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-ink/40 block px-1 tracking-wider uppercase font-bold">
                  Matching Search Results ({filteredItems.length})
                </span>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-10 text-xs font-mono text-ink/40">
                    No items match your search query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredItems.map(item => (
                      <Card 
                        key={item.id} 
                        onClick={() => item.is_available && handleOpenCustomization(item)}
                        className={`bg-white transition-all duration-200 overflow-hidden border border-ticket-edge rounded-2xl ${
                          item.is_available 
                            ? 'hover:shadow-md cursor-pointer' 
                            : 'opacity-60 cursor-not-allowed select-none'
                        }`}
                      >
                        <CardContent className="p-4 flex gap-4 relative">
                          {!item.is_available && (
                            <div className="absolute top-3 right-3 z-10">
                              <Badge variant="secondary" className="font-mono text-[8px] tracking-wider uppercase font-bold text-red-500 bg-red-50 border-red-100">
                                sold out
                              </Badge>
                            </div>
                          )}
                          
                          <div className="h-20 w-20 bg-background border border-ticket-edge rounded-xl flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
                            {item.image_url.startsWith('http') ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              item.image_url || '🍔'
                            )}
                          </div>

                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-sm truncate text-ink">{item.name}</h4>
                                <span className="font-mono text-sm font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-ink/60 line-clamp-2 mt-1 leading-relaxed">
                                {item.description || 'No description provided.'}
                              </p>
                            </div>

                            {item.is_available && (
                              <div className="flex justify-end pt-2">
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary hover:text-white gap-1 rounded-lg">
                                  <Plus className="h-3 w-3" />
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Case B: Standard Category Tab browse */}
            {searchTerm.trim() === '' && categories.map(cat => {
              const catItems = filteredItems.filter(i => i.category_id === cat.id)
              if (catItems.length === 0) return null
              if (activeCategory !== cat.id) return null

              return (
                <div key={cat.id} className="space-y-4 animate-fade-in">
                  {cat.description && (
                    <p className="text-xs text-ink/50 font-mono italic px-1">{cat.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {catItems.map(item => (
                      <Card 
                        key={item.id} 
                        onClick={() => item.is_available && handleOpenCustomization(item)}
                        className={`bg-white transition-all duration-200 overflow-hidden border border-ticket-edge rounded-2xl ${
                          item.is_available 
                            ? 'hover:shadow-md cursor-pointer' 
                            : 'opacity-60 cursor-not-allowed select-none'
                        }`}
                      >
                        <CardContent className="p-4 flex gap-4 relative">
                          {!item.is_available && (
                            <div className="absolute top-3 right-3 z-10">
                              <Badge variant="secondary" className="font-mono text-[8px] tracking-wider uppercase font-bold text-red-500 bg-red-50 border-red-100">
                                sold out
                              </Badge>
                            </div>
                          )}

                          <div className="h-20 w-20 bg-background border border-ticket-edge rounded-xl flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
                            {item.image_url.startsWith('http') ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              item.image_url || '🍔'
                            )}
                          </div>

                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-sm truncate text-ink">{item.name}</h4>
                                <span className="font-mono text-sm font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-ink/60 line-clamp-2 mt-1 leading-relaxed">
                                {item.description || 'No description provided.'}
                              </p>
                            </div>

                            {item.is_available && (
                              <div className="flex justify-end pt-2">
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary hover:text-white gap-1 rounded-lg">
                                  <Plus className="h-3 w-3" />
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </main>

        </div>

      </div>

      {/* 4. CUSTOMIZATION DIALOG MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <Card className="bg-white rounded-2xl w-full max-w-sm overflow-hidden z-50">
            {/* torn decoration */}
            <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
              ))}
            </div>

            <CardContent className="p-6 space-y-4">
              
              <div className="flex justify-between items-start border-b border-dashed border-ink/15 pb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-ink truncate">{customizingItem.name}</h3>
                  <span className="font-mono text-xs font-bold text-primary block mt-0.5">${Number(customizingItem.price).toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setCustomizingItem(null)}
                  className="h-8 w-8 rounded-full bg-background flex items-center justify-center border text-ink/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Special options */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-ink/45 block uppercase tracking-wider">Customize Order</span>
                
                {/* Standard addon choices mock */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { name: 'Extra Cheese', price: 1.00 },
                    { name: 'Add Bacon', price: 1.50 },
                    { name: 'Double Patty', price: 3.00 },
                    { name: 'Avocado Slice', price: 1.25 }
                  ].map(add => {
                    const isSelected = selectedAddons.some(a => a.name === add.name)
                    return (
                      <button
                        key={add.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAddons(prev => prev.filter(a => a.name !== add.name))
                          } else {
                            setSelectedAddons(prev => [...prev, add])
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5 text-primary font-semibold' 
                            : 'border-ticket-edge bg-background hover:bg-stone-50'
                        }`}
                      >
                        <span>{add.name}</span>
                        <span className="font-mono text-[10px] text-ink/50">+${add.price.toFixed(2)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cooking Notes */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-ink/45 block uppercase tracking-wider">Preparation Notes</label>
                <textarea
                  placeholder="E.g., Medium rare, sauce on side..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-ticket-edge rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px] resize-none"
                />
              </div>

              {/* Quantity */}
              <div className="flex justify-between items-center pt-3 border-t border-stone-50">
                <span className="text-xs font-semibold text-ink">Quantity</span>
                <div className="flex items-center gap-3">
                  <button 
                    disabled={itemQuantity <= 1}
                    onClick={() => setItemQuantity(itemQuantity - 1)}
                    className="h-7 w-7 rounded-full bg-background border flex items-center justify-center text-ink/50 hover:bg-stone-50 disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold text-ink w-4 text-center">{itemQuantity}</span>
                  <button 
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="h-7 w-7 rounded-full bg-background border flex items-center justify-center text-ink/50 hover:bg-stone-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Save */}
              <Button 
                onClick={handleAddToCart}
                className="w-full h-10 font-mono text-xs font-bold uppercase tracking-wider mt-2"
              >
                Add to Ticket Cart
              </Button>

            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. FLOATING CART TRIGGER BAR */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-30 max-w-sm mx-auto select-none">
          <Button 
            onClick={() => setCartOpen(true)}
            className="w-full h-12 shadow-lg rounded-full px-5 flex justify-between items-center tracking-wider font-mono text-xs font-bold uppercase gap-2 bg-primary hover:bg-primary/95 text-white"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Ticket Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
            </div>
            <div className="flex items-center gap-1">
              <span>${cartTotals.total.toFixed(2)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Button>
        </div>
      )}

      {/* 6. SLIDING CART DRAWER OVERLAY */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col relative select-none">
            
            {/* Header */}
            <div className="p-4 border-b border-ticket-edge flex justify-between items-center select-none">
              <span className="font-bold text-sm font-mono uppercase tracking-tight">Your Order Ticket</span>
              <button 
                onClick={() => setCartOpen(false)}
                className="h-8 w-8 rounded-full bg-background flex items-center justify-center border text-ink/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background/30">
              
              {cart.map((cartItem, index) => {
                const addonsPrice = cartItem.selectedAddons.reduce((sum, a) => sum + a.price, 0)
                const itemTotal = (cartItem.item.price + addonsPrice) * cartItem.quantity
                
                return (
                  <Card key={index} className="bg-white border-ticket-edge">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-ink">{cartItem.quantity}x {cartItem.item.name}</h4>
                          <span className="font-mono text-[10px] text-ink/40">${Number(cartItem.item.price).toFixed(2)} each</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-ink">${itemTotal.toFixed(2)}</span>
                      </div>

                      {/* Addons listed */}
                      {cartItem.selectedAddons.length > 0 && (
                        <div className="text-[10px] text-ink/50 pl-3 border-l border-primary/20 space-y-0.5">
                          {cartItem.selectedAddons.map(a => (
                            <div key={a.name}>+ {a.name} (+${a.price.toFixed(2)})</div>
                          ))}
                        </div>
                      )}

                      {/* Prep notes */}
                      {cartItem.notes && (
                        <div className="text-[10px] italic text-primary pl-3 border-l border-primary/20">
                          * "{cartItem.notes}"
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-stone-50 text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateCartQty(index, cartItem.quantity - 1)}
                            className="h-6 w-6 rounded-full bg-background border flex items-center justify-center text-ink/50 hover:bg-stone-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono font-bold text-ink w-4 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(index, cartItem.quantity + 1)}
                            className="h-6 w-6 rounded-full bg-background border flex items-center justify-center text-ink/50 hover:bg-stone-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleUpdateCartQty(index, 0)}
                          className="text-red-500 hover:text-red-650 font-bold uppercase tracking-wider text-[9px]"
                        >
                          Remove
                        </button>
                      </div>

                    </CardContent>
                  </Card>
                )
              })}

              <TicketDivider />

              {/* Costs summary */}
              <div className="space-y-1.5 font-mono text-xs px-2 select-none">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>${cartTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Service Fee</span>
                  <span>$1.50</span>
                </div>
                <div className="flex justify-between font-bold text-ink text-sm pt-2 border-t border-ink/10">
                  <span>Total Amount</span>
                  <span>${cartTotals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Check Form */}
              <Card className="bg-white border-dashed border-2 border-primary/10">
                <CardContent className="p-4 space-y-4">
                  <h4 className="font-mono text-[10px] font-bold text-primary uppercase">Dine-In Billing details</h4>
                  
                  <form onSubmit={handlePlaceOrder} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-ink/40 uppercase block">Your Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="E.g., Guest"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs px-3 h-10 border border-ticket-edge rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-ink/40 uppercase block">WhatsApp Mobile (Optional)</label>
                      <input
                        type="tel"
                        placeholder="E.g., +1 555-0100"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs px-3 h-10 border border-ticket-edge rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-ink/40 uppercase block">Additional Instructions</label>
                      <textarea
                        placeholder="Allergies, table layout requests..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full text-xs p-2.5 border border-ticket-edge rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px] resize-none"
                      ></textarea>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-ink/40 uppercase block">Payment Option</label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('counter')}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            paymentMethod === 'counter' 
                              ? 'bg-ink text-white border-ink font-bold shadow-sm' 
                              : 'bg-background text-ink/70 border-ticket-edge hover:bg-stone-50'
                          }`}
                        >
                          💵 Counter / Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online')}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            paymentMethod === 'online' 
                              ? 'bg-ink text-white border-ink font-bold shadow-sm' 
                              : 'bg-background text-ink/70 border-ticket-edge hover:bg-stone-50'
                          }`}
                        >
                          💳 Online Pay
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={submittingOrder}
                      className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-1.5 mt-2"
                    >
                      {submittingOrder ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          Submit to Kitchen
                        </>
                      )}
                    </Button>

                  </form>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
