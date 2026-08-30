import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendOrderConfirmation, sendRestaurantNewOrderNotification } from '@/utils/whatsapp'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const orderRefNum = formData.get('orderRefNum') as string || formData.get('orderRef') as string
    const responseCode = formData.get('responseCode') as string || '0000'
    const transactionId = formData.get('transactionId') as string || `EP-TXN-${Date.now()}`

    const supabase = await createClient()

    if (!orderRefNum) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Missing+Reference', req.url), 303)
    }

    // 1. Fetch payment record by merchant_reference
    const { data: payment } = await supabase
      .from('payments')
      .select('id, order_id, restaurant_id, amount, status')
      .eq('merchant_reference', orderRefNum)
      .single()

    if (!payment) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Payment+Not+Found', req.url), 303)
    }

    const isSuccess = responseCode === '0000' || responseCode === '00'

    if (isSuccess) {
      // Update Payment to PAID
      await supabase
        .from('payments')
        .update({
          status: 'PAID',
          provider_transaction_id: transactionId,
          paid_at: new Date().toISOString(),
          raw_response_safe: Object.fromEntries(formData.entries())
        })
        .eq('id', payment.id)

      // Update Order to CONFIRMED
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

      // Send WhatsApp notifications asynchronously
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
        ]).catch(err => console.error('WhatsApp dispatch error:', err))
      }

      return NextResponse.redirect(new URL(`/payment/status?status=PAID&orderId=${payment.order_id}&ref=${orderRefNum}&txn=${transactionId}`, req.url), 303)
    } else {
      // Mark as FAILED
      await supabase
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: `EasyPaisa error code: ${responseCode}`,
          raw_response_safe: Object.fromEntries(formData.entries())
        })
        .eq('id', payment.id)

      return NextResponse.redirect(new URL(`/payment/status?status=FAILED&orderId=${payment.order_id}&ref=${orderRefNum}&reason=Payment+Declined`, req.url), 303)
    }

  } catch (err: any) {
    return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Server+Error', req.url), 303)
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderRefNum = searchParams.get('orderRefNum')
  const status = searchParams.get('status') || 'PAID'
  return NextResponse.redirect(new URL(`/payment/status?status=${status}&ref=${orderRefNum || ''}`, req.url), 303)
}
