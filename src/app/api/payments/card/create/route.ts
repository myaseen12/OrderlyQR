import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPaymentProviderConfig, verifyAndCalculateOrderTotal } from '@/utils/payments/engine'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { restaurantId, tableId, cartItems, customerDetails, couponDiscount, cardToken } = body

    if (!restaurantId || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid checkout details.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Recalculate trusted total on server
    const verification = await verifyAndCalculateOrderTotal(supabase, restaurantId, cartItems, couponDiscount || 0)
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 400 })
    }

    const merchantRef = `CARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 2. Create Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId || null,
        order_number: `T-${String(Date.now()).slice(-4)}`,
        customer_name: customerDetails.name || 'Guest Customer',
        customer_phone: customerDetails.phone || null,
        notes: customerDetails.notes || null,
        subtotal: verification.subtotal,
        total: verification.total,
        status: 'pending',
        payment_method: 'card',
        payment_status: 'pending'
      })
      .select('id, order_number')
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: `Order creation failed: ${orderErr?.message}` }, { status: 500 })
    }

    // 3. Create Payment
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        restaurant_id: restaurantId,
        provider: 'card',
        method: 'visa_mastercard',
        amount: verification.total,
        currency: 'PKR',
        status: 'PROCESSING',
        merchant_reference: merchantRef,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (payErr || !payment) {
      return NextResponse.json({ success: false, error: `Payment record creation failed: ${payErr?.message}` }, { status: 500 })
    }

    // Note: Simulated pending real merchant credentials configuration
    await supabase
      .from('payments')
      .update({ status: 'SUCCESS', transaction_id: `CARD-DEMO-TXN-${Date.now()}` })
      .eq('id', payment.id)

    await supabase
      .from('orders')
      .update({ status: 'accepted', payment_status: 'paid' })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentId: payment.id,
      merchantReference: merchantRef,
      status: 'SUCCESS',
      isDemo: true
    })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
