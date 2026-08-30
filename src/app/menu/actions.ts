'use server'

import { createClient } from '@/utils/supabase/server'
import { 
  sendOrderConfirmation, 
  sendRestaurantNewOrderNotification, 
  sendOrderStatusUpdate 
} from '@/utils/whatsapp'

interface CartItemInput {
  itemId: string
  quantity: number
  notes: string
  selectedAddons: { name: string; price: number }[]
}

interface CustomerDetailsInput {
  name: string
  phone: string
  notes: string
  paymentMethod?: 'counter' | 'online'
}

export async function placeOrderAction(
  restaurantId: string,
  tableId: string | null,
  cartItems: CartItemInput[],
  customerDetails: CustomerDetailsInput
) {
  const supabase = await createClient()

  try {
    // 1. Validate restaurant exists
    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurantId)
      .single()

    if (restErr || !restaurant) {
      return { success: false, error: 'Restaurant verification failed.' }
    }

    // 2. Validate table if provided
    let tableNumberStr = ''
    if (tableId) {
      const { data: table, error: tableErr } = await supabase
        .from('restaurant_tables')
        .select('id, table_number, is_active')
        .eq('id', tableId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (tableErr || !table) {
        return { success: false, error: 'Dine-in table verification failed.' }
      }

      if (!table.is_active) {
        return { success: false, error: 'This dining table has been deactivated by staff.' }
      }

      tableNumberStr = table.table_number
    }

    // 3. Fetch active menu items matching cart ids, verifying they belong to the requested restaurant
    const itemIds = cartItems.map(c => c.itemId)
    const { data: dbItems, error: itemsErr } = await supabase
      .from('menu_items')
      .select(`
        id, 
        name, 
        price, 
        is_available, 
        restaurant_id,
        categories (
          is_active
        )
      `)
      .in('id', itemIds)
      .eq('restaurant_id', restaurantId) // Enforce Restaurant Tenant Isolation!

    if (itemsErr || !dbItems || dbItems.length !== itemIds.length) {
      return { success: false, error: 'One or more items in your cart do not belong to this restaurant or do not exist.' }
    }

    // 4. Calculate prices on the server and check availability
    let calculatedSubtotal = 0

    for (const cartItem of cartItems) {
      const dbItem = dbItems.find((i: any) => i.id === cartItem.itemId)
      if (!dbItem) {
        return { success: false, error: 'One or more items in your cart do not exist.' }
      }

      if (!dbItem.is_available) {
        return { success: false, error: `Sorry, "${dbItem.name}" is sold out. Please remove it from your cart.` }
      }

      // Verify category is active
      const isCatActive = (dbItem as any).categories?.is_active !== false
      if (!isCatActive) {
        return { success: false, error: `Sorry, "${dbItem.name}" belongs to a disabled category.` }
      }

      // Addon costs
      const addonsPrice = cartItem.selectedAddons.reduce((sum, a) => sum + a.price, 0)
      
      // Calculate item total using trusted database prices
      calculatedSubtotal += (dbItem.price + addonsPrice) * cartItem.quantity
    }

    const calculatedServiceFee = calculatedSubtotal > 0 ? 1.50 : 0
    const calculatedTotal = calculatedSubtotal + calculatedServiceFee

    // 5. Generate human-friendly sequential order number for today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', todayStartISO)

    const nextOrderNum = (count || 0) + 1
    const orderNumber = `T-${String(nextOrderNum).padStart(3, '0')}`

    // 6. Default Guest Name if empty
    let guestName = customerDetails.name.trim()
    if (!guestName) {
      guestName = tableId ? `Guest (Table ${tableNumberStr})` : 'Takeout Guest'
    }

    // 7. Create main Order record
    const { data: insertedOrder, error: orderCreateErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        order_number: orderNumber,
        customer_name: guestName,
        customer_phone: customerDetails.phone.trim() || null,
        notes: customerDetails.notes.trim() || null,
        subtotal: calculatedSubtotal,
        total: calculatedTotal,
        status: 'pending',
        payment_method: customerDetails.paymentMethod || 'counter',
        payment_status: customerDetails.paymentMethod === 'online' ? 'paid' : 'pending'
      })
      .select('id, status, order_number')
      .single()

    if (orderCreateErr || !insertedOrder) {
      return { success: false, error: `Failed to insert order: ${orderCreateErr?.message}` }
    }

    // 8. Insert Order Items and Addons using database snapshots
    for (const cartItem of cartItems) {
      const dbItem = dbItems.find((i: any) => i.id === cartItem.itemId)!
      
      const { data: insertedItem, error: itemCreateErr } = await supabase
        .from('order_items')
        .insert({
          order_id: insertedOrder.id,
          menu_item_id: dbItem.id,
          quantity: cartItem.quantity,
          item_name_snapshot: dbItem.name,
          price_snapshot: dbItem.price,
          notes: cartItem.notes.trim() || null
        })
        .select('id')
        .single()

      if (itemCreateErr || !insertedItem) {
        return { success: false, error: `Failed to record item details: ${itemCreateErr?.message}` }
      }

      // Addons
      if (cartItem.selectedAddons.length > 0) {
        const addonInserts = cartItem.selectedAddons.map(a => ({
          order_item_id: insertedItem.id,
          addon_name_snapshot: a.name,
          price_snapshot: a.price
        }))
        const { error: addonsCreateErr } = await supabase
          .from('order_item_addons')
          .insert(addonInserts)

        if (addonsCreateErr) {
          return { success: false, error: `Failed to record addon details: ${addonsCreateErr.message}` }
        }
      }
    }

    // 9. Trigger WhatsApp Notifications (Customer Confirmation & Restaurant Notification)
    try {
      const formattedOrderForWA = {
        id: insertedOrder.id,
        order_number: insertedOrder.order_number,
        customer_name: guestName,
        customer_phone: customerDetails.phone.trim() || null,
        status: insertedOrder.status,
        total: calculatedTotal,
        restaurant_name: restaurant.name,
        restaurant_slug: restaurant.slug,
        table_number: tableNumberStr || null
      }
      
      // Fire notifications in parallel, catching any errors safely
      Promise.allSettled([
        sendOrderConfirmation(formattedOrderForWA),
        sendRestaurantNewOrderNotification(formattedOrderForWA)
      ]).catch(err => {
        console.error('Failed to dispatch background notifications:', err)
      })

    } catch (waErr) {
      console.error('WhatsApp service alert trigger failed:', waErr)
    }

    return {
      success: true,
      orderId: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
      status: insertedOrder.status
    }

  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Server Action to update order status and trigger WhatsApp status alerts
 */
export async function updateOrderStatusAction(orderId: string, nextStatus: string) {
  const supabase = await createClient()

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId)
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        status,
        total,
        restaurants (
          name,
          slug
        ),
        restaurant_tables (
          table_number
        )
      `)
      .single()

    if (error || !order) {
      return { success: false, error: error?.message || 'Failed to update order status.' }
    }

    // Trigger customer status alert in background
    try {
      const formattedOrderForWA = {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        status: order.status,
        total: Number(order.total),
        restaurant_name: (order.restaurants as any)?.name || 'OrderlyQR Partner',
        restaurant_slug: (order.restaurants as any)?.slug || '',
        table_number: (order.restaurant_tables as any)?.table_number || null
      }
      
      sendOrderStatusUpdate(formattedOrderForWA).catch(err => {
        console.error('Failed to send status update notification:', err)
      })
    } catch (waErr) {
      console.error('WhatsApp status trigger error:', waErr)
    }

    return { success: true, order }

  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Server Action to submit customer feedback and rating for a served order
 */
export async function submitOrderFeedbackAction(
  orderId: string,
  restaurantId: string,
  rating: number,
  comment?: string
) {
  const supabase = await createClient()

  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5 stars.' }
  }

  try {
    const { data, error } = await supabase
      .from('order_feedback')
      .insert({
        order_id: orderId,
        restaurant_id: restaurantId,
        rating,
        comment: comment?.trim() || null
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message || 'Failed to submit feedback.' }
    }

    return { success: true, feedbackId: data.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred while submitting feedback.' }
  }
}

/**
 * Server Action to request a table reservation
 */
export async function requestTableReservationAction(
  restaurantId: string,
  customerName: string,
  customerPhone: string,
  partySize: number,
  reservationTime: string,
  notes?: string
) {
  const supabase = await createClient()

  if (!customerName.trim() || !customerPhone.trim() || partySize <= 0) {
    return { success: false, error: 'Please provide valid name, phone, and party size.' }
  }

  try {
    const { data, error } = await supabase
      .from('table_reservations')
      .insert({
        restaurant_id: restaurantId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        party_size: partySize,
        reservation_time: reservationTime,
        status: 'pending',
        notes: notes?.trim() || null
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message || 'Failed to request reservation.' }
    }

    return { success: true, reservationId: data.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred while placing reservation.' }
  }
}

/**
 * Server Action for admin to accept/decline table reservations
 */
export async function updateReservationStatusAction(
  reservationId: string,
  status: 'accepted' | 'declined'
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('table_reservations')
      .update({ status })
      .eq('id', reservationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Server Action to validate coupon code for a restaurant order
 */
export async function validateCouponAction(
  restaurantId: string,
  couponCode: string,
  cartSubtotal: number
) {
  const code = couponCode.trim().toUpperCase()
  if (!code) {
    return { success: false, error: 'Please enter a valid coupon code.' }
  }

  // Pre-configured valid coupons (or dynamically loaded from DB)
  const MOCK_COUPONS: Record<string, { discountPercent?: number; fixedDiscount?: number; minSubtotal: number; maxDiscount: number }> = {
    'WELCOME10': { discountPercent: 10, minSubtotal: 2000, maxDiscount: 1000 },
    'RUSTIQUE15': { discountPercent: 15, minSubtotal: 4000, maxDiscount: 1500 },
    'SAVE500': { fixedDiscount: 500, minSubtotal: 3000, maxDiscount: 500 },
  }

  const coupon = MOCK_COUPONS[code]
  if (!coupon) {
    return { success: false, error: 'Invalid or expired promo code.' }
  }

  if (cartSubtotal < coupon.minSubtotal) {
    return { 
      success: false, 
      error: `Coupon requires a minimum subtotal of PKR ${coupon.minSubtotal.toLocaleString()}` 
    }
  }

  let discountAmount = 0
  if (coupon.discountPercent) {
    discountAmount = Math.round((cartSubtotal * coupon.discountPercent) / 100)
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else if (coupon.fixedDiscount) {
    discountAmount = coupon.fixedDiscount
  }

  // Prevent discount from exceeding subtotal
  discountAmount = Math.min(discountAmount, cartSubtotal)

  return {
    success: true,
    code,
    discountAmount,
    message: `Promo code ${code} applied successfully!`
  }
}

