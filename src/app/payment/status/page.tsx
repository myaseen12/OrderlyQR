'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { BackButton } from '@/components/ui/BackButton'
import { formatCurrency } from '@/utils/currency'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChefHat, 
  ArrowRight, 
  RotateCcw, 
  Receipt,
  Wallet,
  CreditCard,
  Banknote,
  Home
} from 'lucide-react'

export default function PaymentStatusPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const statusParam = searchParams.get('status') || 'PENDING'
  const refParam = searchParams.get('ref') || ''
  const orderIdParam = searchParams.get('orderId') || ''
  const reasonParam = searchParams.get('reason') || ''
  const txnParam = searchParams.get('txn') || ''

  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyPaymentOnServer() {
      try {
        if (refParam || orderIdParam) {
          const res = await fetch(`/api/payments/verify?ref=${encodeURIComponent(refParam)}&orderId=${encodeURIComponent(orderIdParam)}`)
          const json = await res.json()
          if (json.success && json.payment) {
            setPaymentDetails(json.payment)
          }
        }
      } catch (err) {
        console.error('Payment verification request failed:', err)
      } finally {
        setLoading(false)
      }
    }
    verifyPaymentOnServer()
  }, [refParam, orderIdParam])

  const status = paymentDetails?.status || statusParam.toUpperCase()
  const amount = paymentDetails?.amount || 0
  const orderNumber = paymentDetails?.orders?.order_number || 'T-1048'
  const provider = paymentDetails?.provider || (refParam.startsWith('EP') ? 'easypaisa' : refParam.startsWith('JC') ? 'jazzcash' : 'card')

  return (
    <div className="min-h-screen bg-background font-sans text-ink flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex justify-between items-center">
          <BackButton fallbackUrl="/" />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 font-mono text-xs text-ink/60">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>

        {/* Status Card */}
        <Card className="bg-white border border-ticket-edge shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6 text-center">
            
            {(status === 'PAID' || status === 'SUCCESS') && (
              <>
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <Badge variant="sage" className="font-mono uppercase tracking-widest text-[10px] px-3 py-1">
                    ✓ Paid (Demo Mode)
                  </Badge>
                  <h1 className="font-mono font-bold text-2xl text-ink pt-2">Payment Successful!</h1>
                  <p className="text-xs text-ink/60">Your order has been confirmed and sent directly to the kitchen display.</p>
                </div>
              </>
            )}

            {(status === 'PENDING_CASH' || status === 'COUNTER' || status === 'CASH') && (
              <>
                <div className="h-20 w-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border-4 border-amber-50 shadow-inner">
                  <ChefHat className="h-10 w-10 stroke-[2.5] text-amber-600" />
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="font-mono uppercase tracking-widest text-[10px] px-3 py-1 text-amber-800 border-amber-300 bg-amber-50">
                    ● Order Sent to Kitchen
                  </Badge>
                  <h1 className="font-mono font-bold text-2xl text-ink pt-2">Order Confirmed!</h1>
                  <p className="text-xs text-ink/60">Your order is being prepared. Please pay cash at the counter or to your server upon dining.</p>
                </div>
              </>
            )}

            {status === 'FAILED' && (
              <>
                <div className="h-20 w-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-rose-50 shadow-inner">
                  <XCircle className="h-10 w-10 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="font-mono uppercase tracking-widest text-[10px] px-3 py-1 text-rose-700 bg-rose-50 border border-rose-200">
                    Payment Unsuccessful
                  </Badge>
                  <h1 className="font-mono font-bold text-2xl text-ink pt-2">Payment Declined</h1>
                  <p className="text-xs text-rose-600 font-mono mt-1">{reasonParam || paymentDetails?.failure_reason || 'The transaction could not be authorized by the provider.'}</p>
                </div>
              </>
            )}

            <TicketDivider />

            {/* Transaction Invoice Summary */}
            <div className="bg-background rounded-2xl p-5 border border-ticket-edge text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-ink/60 text-[10px] uppercase tracking-wider pb-2 border-b border-ticket-edge">
                <span>Payment Summary</span>
                <span>PKR Currency</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-ink/60">Ticket Order #</span>
                <span className="font-bold text-ink">{orderNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-ink/60">Payment Method</span>
                <span className="font-bold text-ink capitalize flex items-center gap-1.5">
                  {provider === 'easypaisa' && <Wallet className="h-3.5 w-3.5 text-emerald-600" />}
                  {provider === 'jazzcash' && <Wallet className="h-3.5 w-3.5 text-rose-600" />}
                  {provider === 'card' && <CreditCard className="h-3.5 w-3.5 text-blue-600" />}
                  {provider === 'cash' && <Banknote className="h-3.5 w-3.5 text-amber-600" />}
                  {provider}
                </span>
              </div>

              {txnParam && (
                <div className="flex justify-between items-center">
                  <span className="text-ink/60">Transaction ID</span>
                  <span className="font-mono font-bold text-ink text-[11px]">{txnParam}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-ticket-edge font-bold text-sm text-ink">
                <span>Amount Paid</span>
                <span className="text-primary">{formatCurrency(amount || 4650)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              {(status === 'PAID' || status === 'SUCCESS' || status === 'PENDING_CASH' || status === 'COUNTER' || status === 'CASH') ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/order/${paymentDetails?.order_id || orderIdParam}`} className="flex-1">
                    <Button className="w-full h-12 font-mono text-xs uppercase tracking-wider gap-2">
                      <Receipt className="h-4 w-4" /> Live Status
                    </Button>
                  </Link>
                  <Link href="/admin/kitchen" className="flex-1">
                    <Button variant="outline" className="w-full h-12 font-mono text-xs uppercase tracking-wider gap-2">
                      <ChefHat className="h-4 w-4" /> Kitchen Board
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => router.back()} 
                    className="flex-1 h-12 font-mono text-xs uppercase tracking-wider gap-2"
                  >
                    <RotateCcw className="h-4 w-4" /> Try Payment Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full h-12 font-mono text-xs uppercase tracking-wider">
                      Back to Menu
                    </Button>
                  </Link>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
