import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPaymentProviderConfig, generateJazzCashSecureHash } from '@/utils/payments/engine'
import { sendOrderConfirmation, sendRestaurantNewOrderNotification } from '@/utils/whatsapp'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>
    
    const txnRefNo = rawData.pp_TxnRefNo
    const responseCode = rawData.pp_ResponseCode
    const responseMessage = rawData.pp_ResponseMessage || 'Payment process finished.'
    const receivedHash = rawData.pp_SecureHash

    const supabase = await createClient()

    if (!txnRefNo) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Missing+Transaction+Ref', req.url), 303)
    }

    // Fetch payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('id, order_id, restaurant_id, amount, status')
      .eq('merchant_reference', txnRefNo)
      .single()

    if (!payment) {
      return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Payment+Record+Not+Found', req.url), 303)
    }

    // Verify Hash Signature for safety
    const config = getPaymentProviderConfig('jazzcash')
    const computedHash = generateJazzCashSecureHash(rawData, config.integritySalt || 'mock_salt')

    const isValidSignature = !receivedHash || receivedHash === computedHash || config.env === 'sandbox'
    const isSuccess = (responseCode === '000' || responseCode === '121') && isValidSignature

    if (isSuccess) {
      // Mark Payment PAID
      await supabase
        .from('payments')
        .update({
          status: 'PAID',
          provider_transaction_id: rawData.pp_RetreivalReferenceNo || `JC-${Date.now()}`,
          paid_at: new Date().toISOString(),
          raw_response_safe: rawData
        })
        .eq('id', payment.id)

      // Mark Order ACCEPTED
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
        ]).catch(err => console.error('WhatsApp notification failed:', err))
      }

      return NextResponse.redirect(new URL(`/payment/status?status=PAID&orderId=${payment.order_id}&ref=${txnRefNo}`, req.url), 303)
    } else {
      // Mark Payment FAILED
      await supabase
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: responseMessage || `JazzCash Code: ${responseCode}`,
          raw_response_safe: rawData
        })
        .eq('id', payment.id)

      return NextResponse.redirect(new URL(`/payment/status?status=FAILED&orderId=${payment.order_id}&ref=${txnRefNo}&reason=${encodeURIComponent(responseMessage)}`, req.url), 303)
    }

  } catch (err: any) {
    return NextResponse.redirect(new URL('/payment/status?status=FAILED&reason=Server+Callback+Error', req.url), 303)
  }
}
