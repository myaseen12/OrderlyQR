import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyAndCalculateOrderTotal } from '@/utils/payments/engine'
import { sendOrderConfirmation, sendRestaurantNewOrderNotification } from '@/utils/whatsapp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { restaurantId, tableId, cartItems, customerDetails, couponDiscount } = body

    if (!restaurantId || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid order checkout data.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Recalculate trusted total on server
    const verification = await verifyAndCalculateOrderTotal(supabase, restaurantId, cartItems, couponDiscount || 0)
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 400 })
    }

    const merchantRef = `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 2. Create Order record (Cash orders start pending cash payment at counter/table)
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
        payment_method: 'counter',
        payment_status: 'pending'
      })
      .select(`
        id, order_number, customer_name, customer_phone, total,
        restaurants ( name, slug ),
        restaurant_tables ( table_number )
      `)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: `Failed to create cash order: ${orderErr?.message}` }, { status: 500 })
    }

    // 3. Create Payment record in DB with method 'cash_at_restaurant'
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        restaurant_id: restaurantId,
        provider: 'cash',
        method: 'cash_at_restaurant',
        amount: verification.total,
        currency: 'PKR',
        status: 'PENDING',
        merchant_reference: merchantRef,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (payErr || !payment) {
      return NextResponse.json({ success: false, error: `Failed to record cash payment: ${payErr?.message}` }, { status: 500 })
    }

    // Dispatch notifications
    const waPayload = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      status: 'pending',
      total: Number(order.total),
      restaurant_name: (order.restaurants as any)?.name || 'OrderlyQR Partner',
      restaurant_slug: (order.restaurants as any)?.slug || '',
      table_number: (order.restaurant_tables as any)?.table_number || null
    }
    Promise.allSettled([
      sendOrderConfirmation(waPayload),
      sendRestaurantNewOrderNotification(waPayload)
    ]).catch(err => console.error('WhatsApp notification error:', err))

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentId: payment.id,
      merchantReference: merchantRef,
      status: 'PENDING_CASH'
    })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
