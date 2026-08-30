'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import QRCode from 'qrcode'
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Loader2 as Loader,
  Printer,
  ExternalLink,
  Edit3,
  AlertCircle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react'

interface TableType {
  id: string
  table_number: string
  qr_token: string
  is_active: boolean
}

// Sub-component to generate and render QR code as an image using the library
function QRCodeImage({ url, className = "h-28 w-28" }: { url: string; className?: string }) {
  const [qrSrc, setQrSrc] = useState('')

  useEffect(() => {
    QRCode.toDataURL(
      url, 
      { 
        width: 250, 
        margin: 2, 
        color: { 
          dark: '#1F1F24', 
          light: '#FFFFFF' 
        } 
      }
    )
      .then(setQrSrc)
      .catch(err => console.error('QR code generation error:', err))
  }, [url])

  if (!qrSrc) {
    return (
      <div className={`${className} animate-pulse bg-background border border-ticket-edge rounded-xl flex items-center justify-center`}>
        <QrCode className="h-5 w-5 text-ink/20" />
      </div>
    )
  }

  return <img src={qrSrc} alt="Table QR Scan Code" className={`${className} object-contain`} />
}

export default function AdminTablesPage() {
  const { restaurant } = useAdmin()
  const [tables, setTables] = useState<TableType[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const supabase = useMemo(() => createClient(), [])

  // Form Fields State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Custom Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Print Table Flyer State
  const [printingTable, setPrintingTable] = useState<TableType | null>(null)

  // Load tables
  const loadTables = async () => {
    if (!restaurant?.id) return
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('table_number')

      if (!error && data) {
        setTables(data as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [restaurant?.id])

  // Open Form
  const handleOpenAddForm = () => {
    setEditingId(null)
    setTableNumber('')
    setIsActive(true)
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (table: TableType) => {
    setEditingId(table.id)
    setTableNumber(table.table_number)
    setIsActive(table.is_active)
    setFormError('')
    setIsFormOpen(true)
  }

  // Delete
  const triggerDeleteConfirm = (id: string) => {
    setDeleteTargetId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteTable = async () => {
    if (!deleteTargetId) return

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', deleteTargetId)

      if (error) {
        alert(`Failed to remove table: ${error.message}`)
        return
      }

      setTables(prev => prev.filter(t => t.id !== deleteTargetId))
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTargetId(null)
    }
  }

  // Toggle Table active / scanning status
  const handleToggleActive = async (table: TableType) => {
    const nextActive = !table.is_active
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ is_active: nextActive })
        .eq('id', table.id)

      if (error) {
        alert(`Failed to update status: ${error.message}`)
        return
      }

      setTables(prev => 
        prev.map(t => t.id === table.id ? { ...t, is_active: nextActive } : t)
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Submit Table Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id || !tableNumber.trim()) return

    // Validations
    const nameExists = tables.some(
      t => t.table_number.toLowerCase().trim() === tableNumber.toLowerCase().trim() && t.id !== editingId
    )
    if (nameExists) {
      setFormError('A table with this number/name already exists.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      if (editingId) {
        // Edit existing table
        const { error } = await supabase
          .from('restaurant_tables')
          .update({
            table_number: tableNumber.trim(),
            is_active: isActive
          })
          .eq('id', editingId)

        if (error) {
          setFormError(`Failed to update table: ${error.message}`)
          return
        }
      } else {
        // Create new table
        const randomToken = `tok-${restaurant.slug}-${Math.random().toString(36).substring(2, 10)}`
        const { error } = await supabase
          .from('restaurant_tables')
          .insert({
            table_number: tableNumber.trim(),
            qr_token: randomToken,
            is_active: isActive,
            restaurant_id: restaurant.id
          })

        if (error) {
          setFormError(`Failed to create table: ${error.message}`)
          return
        }
      }

      setIsFormOpen(false)
      setTableNumber('')
      await loadTables()
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  // Get customer guest URL format
  const getTableUrl = (token: string) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/menu/${restaurant?.slug || 'demo'}?table=${token}`
  }

  // Trigger Print Flyer
  const handlePrintFlyer = (table: TableType) => {
    setPrintingTable(table)
    // Small delay to allow the flyer markup to mount before printing
    setTimeout(() => {
      window.print()
    }, 150)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-5xl">
      
      {/* Header controls */}
      <PageHeader
        title={isFormOpen ? (editingId ? 'Edit Table Settings' : 'Register Dining Table') : 'Table / QR Manager'}
        description="Register dine-in tables, configure tokens, and print scanning flyers"
        fallbackUrl="/admin"
        backLabel={isFormOpen ? 'Tables' : 'Dashboard'}
        showBack={true}
        breadcrumbs={isFormOpen ? [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Tables / QRs', href: '/admin/tables' },
          { label: editingId ? 'Edit Table' : 'Add Table' }
        ] : [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Tables / QRs' }
        ]}
        actions={!isFormOpen ? (
          <Button size="sm" onClick={handleOpenAddForm} className="text-xs font-mono gap-1">
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        ) : undefined}
      />

      {/* Form Card */}
      {isFormOpen && (
        <Card className="bg-white border-2 border-dashed border-primary/20 max-w-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">
              {editingId ? 'Edit Table Settings' : 'Register Dining Table'}
            </h3>

            {formError && (
              <div className="p-3 bg-red-55/10 border border-red-200 text-red-700 rounded-lg text-xs font-mono flex items-center gap-1.5 leading-relaxed">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Table Number / Label</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Table 5, Patio B"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-ticket-edge accent-primary"
                />
                Table is active & scanning enabled
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-ticket-edge">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-4 font-mono text-xs" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={submitting} 
                  className="h-9 px-5 font-mono text-xs gap-1"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Table
                    </>
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="text-center py-20 bg-white border border-ticket-edge rounded-xl">
          <QrCode className="h-10 w-10 mx-auto text-ink/15 mb-3" />
          <h3 className="font-bold text-ink">No Tables Registered</h3>
          <p className="text-xs text-ink/50 mt-1">Register a dining table to print its QR scan code.</p>
          <Button size="sm" className="mt-4 text-xs font-mono gap-1" onClick={handleOpenAddForm}>
            <Plus className="h-4 w-4" />
            Add First Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {tables.map(table => {
            const tableUrl = getTableUrl(table.qr_token)
            return (
              <Card key={table.id} className={`bg-white hover:scale-[1.01] transition-all duration-200 ${!table.is_active ? 'opacity-65' : ''}`}>
                <CardContent className="p-6 flex flex-col justify-between items-center text-center space-y-4">
                  
                  {/* Title */}
                  <div>
                    <h3 className="font-bold text-base text-ink">TABLE {table.table_number}</h3>
                    <Badge variant={table.is_active ? 'sage' : 'secondary'} className="mt-1">
                      {table.is_active ? 'active' : 'inactive'}
                    </Badge>
                  </div>

                  {/* QR code image using local generator */}
                  <div className="h-28 w-28 p-2 bg-background border border-ticket-edge rounded-xl flex items-center justify-center select-none">
                    <QRCodeImage url={tableUrl} />
                  </div>

                  {/* Scannable endpoint URL */}
                  <div className="w-full text-center space-y-1">
                    <span className="text-[8px] font-mono text-ink/35 block uppercase tracking-wider">QR Code URL Endpoint</span>
                    <code className="bg-ink/5 px-2 py-0.5 rounded font-mono text-[9px] text-ink/60 truncate block max-w-full">
                      {tableUrl}
                    </code>
                  </div>

                  <TicketDivider />

                  {/* Buttons */}
                  <div className="flex gap-1.5 w-full justify-between items-center">
                    
                    <button
                      onClick={() => handlePrintFlyer(table)}
                      className="h-7 px-2.5 border border-ticket-edge bg-background hover:bg-ink/5 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5"
                      title="Print Table Flyer Flyer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Card
                    </button>

                    <div className="flex gap-1">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(table)}
                        className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/65"
                        title={table.is_active ? 'Disable table scanning' : 'Enable table scanning'}
                      >
                        {table.is_active ? <Eye className="h-3.5 w-3.5 text-sage-hover" /> : <EyeOff className="h-3.5 w-3.5 text-ink/30" />}
                      </button>

                      <button
                        onClick={() => handleOpenEditForm(table)}
                        className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/60"
                        title="Edit name/number"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => triggerDeleteConfirm(table.id)}
                        className="h-7 w-7 border border-ticket-edge bg-background hover:bg-red-50 text-red-500 rounded flex items-center justify-center"
                        title="Remove Table"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Dining Table?"
        message="Are you sure you want to delete this table? Table tokens will be deactivated, and any guest accessing this QR code will no longer be able to place orders."
        confirmText="Remove Table"
        isDestructive
        onConfirm={handleDeleteTable}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeleteTargetId(null)
        }}
      />

      {/* Standalone overlay designed for print flyers */}
      {printingTable && (
        <div 
          id="print-area" 
          className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 select-none border-2 border-double border-ink/20 m-4 rounded-3xl"
        >
          {/* Tear notch decoration */}
          <div className="w-full flex justify-between absolute top-4 left-0 right-0 px-8">
            <span className="font-mono text-[9px] text-ink/40">OrderlyQR Platform</span>
            <span className="font-mono text-[9px] text-ink/40">Table Scanning System</span>
          </div>

          <div className="space-y-6 my-auto">
            {/* Header Brand */}
            <div>
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-2xl mx-auto border border-primary/20 mb-2">
                🪵
              </div>
              <h2 className="font-mono text-xs font-bold text-ink uppercase tracking-widest">
                {restaurant?.name || 'OrderlyQR Restaurant'}
              </h2>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white border border-ticket-edge rounded-3xl inline-block shadow-md">
              <QRCodeImage url={getTableUrl(printingTable.qr_token)} className="h-44 w-44 mx-auto" />
            </div>

            {/* Table Number */}
            <div className="space-y-1">
              <h1 className="font-extrabold text-2xl text-ink tracking-tight">TABLE {printingTable.table_number}</h1>
              <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">Scan to Order</p>
            </div>

            <div className="border-t border-dashed border-ink/20 pt-4 max-w-[220px] mx-auto text-[9px] text-ink/50 leading-relaxed font-mono">
              * Scan this QR code to view our digital menu, customize items, and place your order directly.
            </div>
          </div>

          {/* Close Print Preview button (hidden on print media) */}
          <button
            onClick={() => setPrintingTable(null)}
            className="absolute bottom-8 right-8 bg-ink text-white font-mono font-bold text-[10px] tracking-wider uppercase px-4 py-2 rounded-lg shadow print:hidden flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Close Preview
          </button>
        </div>
      )}

      {/* Global CSS to handle print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 2rem !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
        }
      `}</style>

    </div>
  )
}
