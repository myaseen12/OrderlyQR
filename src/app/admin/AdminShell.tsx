'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/app/admin/context'
import { logoutAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BackButton } from '@/components/ui/BackButton'
import { 
  ChefHat, 
  Layout, 
  ShoppingCart, 
  Coffee, 
  Layers, 
  QrCode, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  Calendar,
  ChevronLeft,
  Package,
  Users,
  Sparkles,
  GitBranch,
  CreditCard
} from 'lucide-react'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { restaurant, member } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('BR-01 (Downtown Flagship)')

  // Navigation Items definition
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: Layout },
    { label: 'Orders Ledger', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Kitchen Board', path: '/admin/kitchen', icon: ChefHat },
    { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
    { label: 'Menu Manager', path: '/admin/menu', icon: Coffee },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Tables / QRs', path: '/admin/tables', icon: QrCode },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Inventory', path: '/admin/inventory', icon: Package },
    { label: 'Customer CRM', path: '/admin/customers', icon: Users },
    { label: 'Onboarding', path: '/admin/onboarding', icon: Sparkles },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await logoutAction()
  }

  const [showNotifications, setShowNotifications] = useState(false)
  
  const notificationsList = [
    { id: 1, title: 'System Online', time: 'Just now', type: 'info', msg: 'Realtime order WebSockets connected.' },
    { id: 2, title: 'WhatsApp Simulator Active', time: '5m ago', type: 'success', msg: 'Mock WhatsApp notifications ready.' },
    { id: 3, title: 'Inventory Alert', time: '1h ago', type: 'warning', msg: 'Craft IPA stock level normal.' }
  ]

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col md:flex-row font-sans">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-ticket-edge h-screen sticky top-0 flex-shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-ticket-edge flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-base border border-primary/20">
              🪵
            </div>
            <span className="font-bold tracking-tight font-mono text-sm">
              Orderly<span className="text-primary">QR</span>
            </span>
          </div>
          
          {/* Notification Center Bell Icon */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg bg-background border border-ticket-edge text-ink/70 hover:text-ink transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Notification Center"
              aria-label="Toggle notifications menu"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </button>

            {/* Backdrop overlay for closing on click outside */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setShowNotifications(false)} 
                  aria-hidden="true"
                />
                
                {/* Floating Dropdown Card */}
                <div className="absolute left-0 top-full mt-2.5 w-72 sm:w-80 bg-white border border-ticket-edge rounded-xl shadow-2xl z-[100] p-4 space-y-3 select-none">
                  <div className="flex justify-between items-center border-b border-dashed border-ticket-edge pb-2">
                    <span className="font-mono text-xs font-bold text-ink">Notifications</span>
                    <Badge variant="mustard" className="text-[8px]">Live</Badge>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notificationsList.map(n => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-background border border-ticket-edge text-[10px] space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-ink">{n.title}</span>
                          <span className="text-ink/40 font-mono text-[9px]">{n.time}</span>
                        </div>
                        <p className="text-ink/65 leading-relaxed">{n.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Restaurant details & Branch Selector */}
        {restaurant && (
          <div className="mx-3 my-3 space-y-2">
            <div className="p-3 bg-background border border-ticket-edge rounded-xl flex items-center gap-3">
              <div className="h-8 w-8 bg-white border border-ticket-edge rounded-lg flex items-center justify-center text-lg shadow-sm shrink-0">
                {restaurant.logo || '🪵'}
              </div>
              <div className="min-w-0 flex-grow">
                <h4 className="font-bold text-xs truncate text-ink">{restaurant.name}</h4>
                <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider block">
                  {member?.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Branch Selector Dropdown */}
            <div className="px-2 py-1.5 rounded-lg border border-ticket-edge bg-stone-50 flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-[10px] font-mono font-bold text-ink focus:outline-none w-full cursor-pointer"
                title="Select Active Restaurant Branch"
              >
                <option value="BR-01 (Downtown Flagship)">BR-01 (Downtown Flagship)</option>
                <option value="BR-02 (Uptown Express Kiosk)">BR-02 (Uptown Express Kiosk)</option>
                <option value="+ Create New Branch">+ Create New Branch...</option>
              </select>
            </div>
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav className="flex-grow px-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link key={item.path} href={item.path}>
                <span className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all border ${
                  isActive 
                    ? 'bg-ink text-white border-ink shadow-sm' 
                    : 'bg-transparent text-ink/70 border-transparent hover:bg-stone-50 hover:text-ink'
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out block */}
        <div className="p-4 border-t border-ticket-edge bg-background">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-mono h-9 border-dashed text-red-500 border-red-150 hover:bg-red-50 hover:border-red-200 gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>

      </aside>

      {/* 2. MOBILE HEADER BAR */}
      <header className="md:hidden bg-white border-b border-ticket-edge h-14 px-4 flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs border border-primary/20">
            🪵
          </div>
          <span className="font-bold tracking-tight font-mono text-xs">
            Orderly<span className="text-primary">QR</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center text-ink/75"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* 3. MOBILE MENU DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Drawer sheet */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-ticket-edge z-50 md:hidden flex flex-col select-none"
            >
              <div className="p-4 border-b border-ticket-edge flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/40">Navigation</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-ink/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Active Restaurant details inside mobile menu */}
              {restaurant && (
                <div className="p-4 bg-background border-b border-ticket-edge flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border border-ticket-edge rounded-lg flex items-center justify-center text-base shadow-sm">
                    {restaurant.logo || '🪵'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate text-ink">{restaurant.name}</h4>
                    <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider block">
                      {member?.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}

              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                  const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
                  const Icon = item.icon
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                      <span className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all border ${
                        isActive 
                          ? 'bg-ink text-white border-ink shadow-sm' 
                          : 'bg-transparent text-ink/70 border-transparent hover:bg-stone-50 hover:text-ink'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-ticket-edge bg-background">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs font-mono h-9 border-dashed text-red-500 border-red-150 hover:bg-red-50 hover:border-red-200 gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. MAIN PAGE DISPLAY CONSOLE */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto w-full md:max-h-screen">
        {children}
      </main>

    </div>
  )
}
