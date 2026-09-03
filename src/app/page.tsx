'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ChefHat, 
  QrCode, 
  MessageSquare, 
  Smartphone, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  Sparkles,
  Layers,
  UtensilsCrossed,
  Grid,
  Calendar,
  CreditCard,
  Package,
  Clock,
  Star,
  Menu as MenuIcon,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { formatCurrency } from '@/utils/currency'

export default function MarketingLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' as const } }
  }

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* 1. TOP STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-ticket-edge shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* LEFT: Logo & Icon */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl border border-primary/20 group-hover:scale-105 transition-all">
              🪵
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight font-mono text-ink">
                Orderly<span className="text-primary">QR</span>
              </span>
              <span className="text-[9px] font-mono text-ink/40 uppercase tracking-widest -mt-1">Restaurant OS</span>
            </div>
          </Link>

          {/* CENTER: Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-mono font-bold tracking-wide text-ink/75">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#workflow" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#platform" className="hover:text-primary transition-colors">SaaS Scale</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#whatsapp" className="hover:text-primary transition-colors font-sans text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              ● WhatsApp Live
            </a>
          </div>

          {/* RIGHT: CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-10 text-xs font-mono border-ticket-edge hover:border-primary/30">
                Staff Portal
              </Button>
            </Link>
            <Link href="/r/bistro-rustique/table/table-3-uuid">
              <Button size="sm" className="h-10 text-xs font-mono font-bold shadow-sm">
                Try Demo Menu
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-background border border-ticket-edge text-ink"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-ticket-edge p-6 space-y-4 shadow-lg animate-fade-in font-mono text-xs">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-ink/80 hover:text-primary">Features</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-ink/80 hover:text-primary">How It Works</a>
            <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-ink/80 hover:text-primary">SaaS Scale</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-ink/80 hover:text-primary">Pricing</a>
            <div className="pt-4 border-t border-ticket-edge flex flex-col gap-3">
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Staff Portal</Button>
              </Link>
              <Link href="/r/bistro-rustique/table/table-3-uuid" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Try Demo Menu</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: Headline & CTAs */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="lg:col-span-7 space-y-6 text-center lg:text-left"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen Restaurant Commerce Platform
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-ink font-sans">
            Ditch the App.<br/>
            <span className="text-primary">Scan. Order. Eat.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg text-ink/70 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
            OrderlyQR turns any restaurant table into a high-speed digital POS. Customers scan to order in seconds, kitchen staff receive instant tickets in a clean console, and realtime notifications dispatch over WhatsApp.
          </motion.p>

          {/* PRIMARY & SECONDARY CTA BUTTONS */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link href="/r/bistro-rustique/table/table-3-uuid" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-sm font-mono font-bold tracking-wide gap-2.5 shadow-lg active:scale-98 rounded-xl">
                <QrCode className="h-5 w-5 text-amber-200" />
                Scan Menu Demo (Table 3)
              </Button>
            </Link>
            <Link href="/admin" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-sm font-mono font-bold gap-2.5 border-ink/20 hover:bg-stone-100 rounded-xl">
                <ChefHat className="h-5 w-5 text-primary" />
                Open Kitchen Console →
              </Button>
            </Link>
          </motion.div>

          {/* TRUST INDICATOR CHIPS */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs font-mono font-bold text-ink/65">
            <div className="flex items-center gap-1.5 bg-white border border-ticket-edge px-3 py-1.5 rounded-lg shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" /> No App Download Required
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-ticket-edge px-3 py-1.5 rounded-lg shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" /> Multi-Tenant SaaS
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-ticket-edge px-3 py-1.5 rounded-lg shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" /> Realtime KOT Sync
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: Interactive Kitchen Receipt Order Ticket (In PKR) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 relative flex justify-center"
        >
          <Card className="w-full max-w-sm bg-white border border-ticket-edge shadow-xl rounded-2xl overflow-hidden transform hover:rotate-0 transition-transform duration-300">
            {/* Torn ticket header edge */}
            <div className="h-2 bg-ink/10 flex justify-between overflow-hidden">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-background -mt-1.5" />
              ))}
            </div>

            <CardContent className="p-6 space-y-5 font-mono">
              <div className="text-center border-b border-dashed border-ink/15 pb-4">
                <span className="text-xs font-bold block tracking-widest text-ink/50 uppercase">BISTRO RUSTIQUE</span>
                <span className="text-[10px] block mt-0.5 text-primary font-bold">TABLE 03 · ORDER TICKET</span>
              </div>

              {/* Ticket Items in PKR */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-ink">1x Rustique Smash Burger</span>
                    <span className="block text-[10px] text-ink/50 pl-2">+ Aged Cheddar (+{formatCurrency(400)})</span>
                  </div>
                  <span className="font-bold text-ink">{formatCurrency(4650)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">1x Truffle Parmesan Fries</span>
                  <span className="font-bold text-ink">{formatCurrency(2700)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">1x Rosemary Lemonade</span>
                  <span className="font-bold text-ink">{formatCurrency(1550)}</span>
                </div>
              </div>

              <TicketDivider />

              {/* Totals in PKR */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{formatCurrency(8900)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Service Fee</span>
                  <span>{formatCurrency(400)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-ink pt-2 border-t border-ink/10">
                  <span>TOTAL BILL</span>
                  <span className="text-primary">{formatCurrency(9300)}</span>
                </div>
              </div>

              {/* Live Kitchen Badge */}
              <div className="bg-sage/15 border border-sage/30 text-sage-hover text-[11px] font-bold py-2 rounded-xl text-center uppercase tracking-wider flex items-center justify-center gap-2">
                <ChefHat className="h-4 w-4 animate-spin text-sage-hover" />
                PREPARING IN KITCHEN
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </main>

      {/* 3. PRODUCT VALUE STRIP */}
      <section className="w-full bg-white border-y border-ticket-edge py-10 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-ink font-mono">QR Ordering</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">Instant table menus without app downloads.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-ink font-mono">Kitchen KOT Display</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">Monospace live ticket dispatch for chefs.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-ink font-mono">WhatsApp Alerts</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">Automated SMS & WhatsApp order confirmations.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-ink font-mono">Restaurant Analytics</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">PKR sales tracking and table throughput.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID SECTION */}
      <section id="features" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-primary tracking-widest">Built For Modern Hospitality</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink font-sans">Everything Your Restaurant Platform Requires</h2>
          <p className="text-xs sm:text-sm text-ink/65 leading-relaxed">
            Eliminate server wait times, increase table turnover by 25%, and deliver a 5-star digital dining experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: QrCode, title: 'QR Digital Menu', desc: 'Customizable categories, item modifiers, badges, and instant availability toggles.' },
            { icon: ChefHat, title: 'Kitchen KOT Display', desc: 'Realtime WebSocket sound alerts and station routing for kitchen staff.' },
            { icon: MessageSquare, title: 'WhatsApp Alerts', desc: 'Direct WhatsApp order receipts and meal status updates for guests.' },
            { icon: TrendingUp, title: 'Smart Analytics', desc: 'Revenue, top selling dishes, table velocity, and peak hour reports in PKR.' },
            { icon: Grid, title: 'Table Management', desc: 'Dynamic QR token generation and live floor plan occupancy tracking.' },
            { icon: Calendar, title: 'Table Reservations', desc: 'Guest booking management with party size tracking and confirmation.' },
            { icon: CreditCard, title: 'POS Integration', desc: 'Counter billing, cash/card split payments, and receipt printing support.' },
            { icon: Package, title: 'Inventory Controls', desc: 'Ingredient stock warnings and automated low-stock item markdowns.' },
          ].map((feature, idx) => (
            <Card key={idx} className="bg-white border border-ticket-edge hover:border-primary/40 transition-all hover:shadow-md p-6 space-y-3 rounded-2xl">
              <feature.icon className="h-7 w-7 text-primary" />
              <h3 className="font-bold text-sm text-ink font-mono">{feature.title}</h3>
              <p className="text-xs text-ink/60 leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. 3-STEP WORKFLOW ("HOW IT WORKS") */}
      <section id="workflow" className="w-full bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-widest">Seamless 3-Step Flow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans">How OrderlyQR Operates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <span className="text-3xl font-extrabold font-mono text-amber-400">01</span>
              <h3 className="text-xl font-bold text-white">SCAN</h3>
              <p className="text-xs text-stone-300 leading-relaxed font-mono">
                Customer sits at Table 03 and scans the unique QR code using their camera phone. No mobile app download needed.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <span className="text-3xl font-extrabold font-mono text-amber-400">02</span>
              <h3 className="text-xl font-bold text-white">ORDER</h3>
              <p className="text-xs text-stone-300 leading-relaxed font-mono">
                Customer selects dishes, customizes toppings, inputs special kitchen notes, and submits their ticket in PKR.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <span className="text-3xl font-extrabold font-mono text-amber-400">03</span>
              <h3 className="text-xl font-bold text-white">SERVE</h3>
              <p className="text-xs text-stone-300 leading-relaxed font-mono">
                Kitchen console rings, chef prepares the food, server delivers the dish, and payment is settled smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RESTAURANT DASHBOARD ANALYTICS PREVIEW (IN PKR) */}
      <section id="platform" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-primary tracking-widest block">Executive Insights</span>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink font-sans">Live Restaurant Performance Dashboard</h2>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100/80 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full shadow-2xs">
              Sample Data
            </span>
          </div>
          <p className="text-xs text-ink/50 font-mono">
            Illustrative preview metrics for a single branch. Realtime sales & KOT ticket metrics update automatically once your restaurant goes live.
          </p>
        </div>

        <Card className="bg-white border border-ticket-edge shadow-lg rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-mono">
            <div className="bg-background p-4 rounded-xl border border-ticket-edge">
              <span className="text-[10px] text-ink/40 uppercase block">Today's Sales</span>
              <span className="text-lg font-bold text-primary block mt-1">{formatCurrency(248500)}</span>
            </div>
            <div className="bg-background p-4 rounded-xl border border-ticket-edge">
              <span className="text-[10px] text-ink/40 uppercase block">Completed Orders</span>
              <span className="text-lg font-bold text-ink block mt-1">184</span>
            </div>
            <div className="bg-background p-4 rounded-xl border border-ticket-edge">
              <span className="text-[10px] text-ink/40 uppercase block">Avg Order Value</span>
              <span className="text-lg font-bold text-ink block mt-1">{formatCurrency(1350)}</span>
            </div>
            <div className="bg-background p-4 rounded-xl border border-ticket-edge">
              <span className="text-[10px] text-ink/40 uppercase block">Guests Served</span>
              <span className="text-lg font-bold text-ink block mt-1">126</span>
            </div>
            <div className="bg-background p-4 rounded-xl border border-ticket-edge col-span-2 md:col-span-1">
              <span className="text-[10px] text-ink/40 uppercase block">Active KOT Tickets</span>
              <span className="text-lg font-bold text-emerald-600 block mt-1">32 Active</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. WHATSAPP INTEGRATION SECTION */}
      <section id="whatsapp" className="w-full bg-emerald-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-1 rounded-full">
              ● Automated Notifications
            </span>
            <h2 className="text-3xl font-extrabold font-sans">Instant WhatsApp Order Confirmation</h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-sans max-w-xl">
              Keep customers informed without downloading apps. OrderlyQR automatically dispatches digital receipt tickets, chef status updates, and table ready alerts straight to the guest's WhatsApp.
            </p>
          </div>

          <div className="md:col-span-5 flex justify-center">
            <div className="bg-stone-900 border border-emerald-500/30 rounded-2xl p-4 w-full max-w-xs text-xs font-sans text-stone-200 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold block text-white text-xs">Bistro Rustique Order</span>
                  <span className="text-[10px] text-stone-400">WhatsApp Notification</span>
                </div>
              </div>
              <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/20 space-y-1 font-mono text-[11px]">
                <p className="font-bold text-emerald-300">Ticket ORD-0245 Confirmed!</p>
                <p className="text-stone-300">Table 03 · {formatCurrency(9300)}</p>
                <p className="text-stone-400 text-[10px] pt-1">Chef is preparing your meal now. Stay seated!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION (IN PKR) */}
      <section id="pricing" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-primary tracking-widest">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink font-sans">Choose Your Restaurant Plan</h2>
          <p className="text-xs text-ink/60 font-mono">14-Day Free Trial Available · Instant Setup · No Credit Card Required</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white border border-ticket-edge rounded-2xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-ink font-mono">Starter</h3>
              <p className="text-xs text-ink/60">Ideal for cafes and small eateries</p>
              <div className="text-3xl font-extrabold font-mono text-ink">{formatCurrency(4999)} <span className="text-xs font-normal text-ink/50">/ month</span></div>
              <ul className="space-y-2 text-xs font-mono text-ink/75 pt-4 border-t border-ticket-edge">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Up to 15 Tables</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Digital QR Menu</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Kitchen KOT Display</li>
              </ul>
            </div>
            <Link href="/signup?plan=starter">
              <Button variant="outline" className="w-full font-mono text-xs">Get Started</Button>
            </Link>
          </Card>

          <Card className="bg-white border-2 border-primary rounded-2xl p-8 space-y-6 flex flex-col justify-between shadow-lg relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
              Most Popular
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-ink font-mono">Growth</h3>
              <p className="text-xs text-ink/60">Full operating platform for busy restaurants</p>
              <div className="text-3xl font-extrabold font-mono text-primary">{formatCurrency(9999)} <span className="text-xs font-normal text-ink/50">/ month</span></div>
              <ul className="space-y-2 text-xs font-mono text-ink/75 pt-4 border-t border-ticket-edge">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Unlimited Tables</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> WhatsApp Integration</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Analytics & Reports</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Reservations & POS</li>
              </ul>
            </div>
            <Link href="/signup?plan=growth">
              <Button className="w-full font-mono text-xs">Start 14-Day Free Trial</Button>
            </Link>
          </Card>

          <Card className="bg-white border border-ticket-edge rounded-2xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-ink font-mono">Enterprise</h3>
              <p className="text-xs text-ink/60">Multi-branch restaurant chains</p>
              <div className="text-3xl font-extrabold font-mono text-ink">Custom Quote</div>
              <ul className="space-y-2 text-xs font-mono text-ink/75 pt-4 border-t border-ticket-edge">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Multi-Branch Management</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Custom API Integrations</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Dedicated Account Manager</li>
              </ul>
            </div>
            <Link href="/signup?plan=enterprise">
              <Button variant="outline" className="w-full font-mono text-xs">Contact Sales</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="w-full bg-stone-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-sans">Ready To Modernize Your Restaurant?</h2>
          <p className="text-xs sm:text-sm text-stone-300 font-mono">Start serving guests faster with OrderlyQR today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link href="/r/bistro-rustique/table/table-3-uuid">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 font-mono text-xs font-bold">Try Demo Menu</Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 font-mono text-xs font-bold border-white/30 text-white hover:bg-white/10">Staff Portal</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE FOOTER */}
      <footer className="bg-white border-t border-ticket-edge py-12 text-xs font-mono text-ink/65">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center text-sm border border-primary/20">🪵</div>
              <span className="font-bold text-base font-mono text-ink">Orderly<span className="text-primary">QR</span></span>
            </div>
            <p className="text-[11px] text-ink/50 leading-relaxed max-w-sm">
              The premier QR dining, POS, kitchen management, and customer CRM SaaS platform for forward-thinking restaurants.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-ink uppercase tracking-wider text-[10px] mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-primary">QR Menu</a></li>
              <li><a href="#features" className="hover:text-primary">Kitchen KOT</a></li>
              <li><a href="#whatsapp" className="hover:text-primary">WhatsApp Alerts</a></li>
              <li><a href="#platform" className="hover:text-primary">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink uppercase tracking-wider text-[10px] mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/admin" className="hover:text-primary">Staff Portal</Link></li>
              <li><Link href="/login" className="hover:text-primary">Login</Link></li>
              <li><Link href="/signup" className="hover:text-primary">Sign Up</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink uppercase tracking-wider text-[10px] mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-primary cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-primary cursor-pointer">Security</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-ticket-edge flex flex-col sm:flex-row justify-between items-center text-[10px] text-ink/40 gap-4">
          <span>© {new Date().getFullYear()} OrderlyQR SaaS platform. All rights reserved.</span>
          <span>Prices formatted in Pakistani Rupees (PKR).</span>
        </div>
      </footer>

    </div>
  )
}
