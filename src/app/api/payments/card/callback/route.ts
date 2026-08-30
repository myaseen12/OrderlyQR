import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendOrderConfirmation, sendRestaurantNewOrderNotification } from '@/utils/whatsapp'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ref = searchParams.get('ref')
    const status = searchParams.get('status')

    if (!ref) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Missing+Card+Reference', req.url), 303)
    }

    const supabase = await createClient()
    const { data: payment } = await supabase
      .from('payments')
      .select('id, order_id, amount')
      .eq('merchant_reference', ref)
      .single()

    if (!payment) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Payment+Not+Found', req.url), 303)
    }

    if (status === 'SUCCESS') {
      const txnId = `CARD-TXN-${Date.now()}`
      await supabase
        .from('payments')
        .update({
          status: 'PAID',
          provider_transaction_id: txnId,
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      const { data: order } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          payment_status: 'paid'
        })
        .eq('id', payment.order_id)
        .select(`
          id, order_number, customer_name, customer_phone, total,
          restaurants ( name, slug ),
          restaurant_tables ( table_number )
        `)
        .single()

      if (order) {
        const waPayload = {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          status: 'accepted',
          total: Number(order.total),
          restaurant_name: (order.restaurants as any)?.name || 'OrderlyQR Partner',
          restaurant_slug: (order.restaurants as any)?.slug || '',
          table_number: (order.restaurant_tables as any)?.table_number || null
        }
        Promise.allSettled([
          sendOrderConfirmation(waPayload),
          sendRestaurantNewOrderNotification(waPayload)
        ]).catch(err => console.error('WhatsApp failed:', err))
      }

      return NextResponse.redirect(new URL(`/payment/status?status=PAID&orderId=${payment.order_id}&ref=${ref}&txn=${txnId}`, req.url), 303)
    } else {
      await supabase
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: '3DS Card verification declined or cancelled.'
        })
        .eq('id', payment.id)

      return NextResponse.redirect(new URL(`/payment/status?status=FAILED&orderId=${payment.order_id}&ref=${ref}&reason=Card+Payment+Declined`, req.url), 303)
    }

  } catch (err: any) {
    return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Server+Error', req.url), 303)
  }
}
