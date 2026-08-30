import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ref = searchParams.get('ref')
    const orderId = searchParams.get('orderId')

    if (!ref && !orderId) {
      return NextResponse.json({ success: false, error: 'Payment reference or order ID required.' }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase.from('payments').select(`
      id,
      order_id,
      restaurant_id,
      provider,
      method,
      amount,
      currency,
      status,
      provider_transaction_id,
      merchant_reference,
      failure_reason,
      created_at,
      paid_at,
      orders (
        id,
        order_number,
        customer_name,
        customer_phone,
        status,
        total
      )
    `)

    if (ref) {
      query = query.eq('merchant_reference', ref)
    } else if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: payment, error } = await query.single()

    if (error || !payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
