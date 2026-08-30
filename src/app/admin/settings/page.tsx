'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Settings, 
  Check, 
  Loader2 as Loader,
  AlertCircle,
  Building,
  Smartphone,
  Info
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { restaurant, refreshRestaurant } = useAdmin()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = useMemo(() => createClient(), [])

  // Form Fields State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('🪵')
  const [whatsapp, setWhatsapp] = useState('')

  // Prepopulate form on load
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name)
      setDescription(restaurant.description || '')
      setLogo(restaurant.logo || '🪵')
      setWhatsapp(restaurant.whatsapp_number || '')
    }
  }, [restaurant])

  // Submit Settings Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id) return

    setLoading(true)
    setSuccess(false)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: name.trim(),
          description: description.trim(),
          logo: logo.trim(),
          whatsapp_number: whatsapp.trim()
        })
        .eq('id', restaurant.id)

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // Success
      setSuccess(true)
      // Refresh admin layout context to update sidebar header details!
      await refreshRestaurant()
      
      // Auto dismiss success notification
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 select-none max-w-lg">
      
      {/* Header */}
      <PageHeader
        title="Restaurant Settings"
        description="Configure your tenant branding, description, and WhatsApp details"
        fallbackUrl="/admin"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Settings' }
        ]}
      />

      <Card className="bg-white">
        {/* receipt tear decoration */}
        <div className="h-1 bg-ink/10 flex justify-between overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-background -mt-1.5" />
          ))}
        </div>

        <CardContent className="p-6 space-y-4">
          
          {success && (
            <div className="p-3 bg-sage/10 border border-sage/20 text-sage-hover rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
              <Check className="h-4 w-4 stroke-[3]" />
              Branding updated successfully!
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs font-mono">
              ⚠️ Update failed: {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Restaurant name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Restaurant Name</label>
              <div className="relative">
                <Building className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="E.g., Bistro Rustique"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              
              {/* Logo icon */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Brand Logo</label>
                <input
                  type="text"
                  required
                  placeholder="🪵"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full text-xs px-3 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary text-center"
                />
              </div>

              {/* Whatsapp */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">WhatsApp Number</label>
                <div className="relative">
                  <Smartphone className="h-4 w-4 text-ink/30 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 h-11 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Restaurant Description</label>
              <textarea
                placeholder="Brief taglines, cuisine details, dining hours..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none leading-relaxed"
              />
            </div>

            <TicketDivider />

            {/* Hint box */}
            <div className="bg-background border border-ticket-edge p-3.5 rounded-lg text-[10px] text-ink/65 flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Branding updates take effect immediately for customer menu links and kitchen receipts.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-1.5 mt-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Configurations
                </>
              )}
            </Button>

          </form>

        </CardContent>
      </Card>

    </div>
  )
}
