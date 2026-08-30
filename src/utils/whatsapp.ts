import 'server-only'

interface WhatsAppOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone?: string | null
  status: string
  total: number
  restaurant_name: string
  restaurant_slug: string
  table_number?: string | null
}

const API_VERSION = 'v20.0'

/**
 * Core helper to dispatch messages via Meta WhatsApp Cloud API
 */
async function sendWhatsAppMessage(
  recipientPhone: string,
  payload: object,
  retriesLeft = 2
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  // 1. Safe Sandbox/Development Mode fallback
  if (!apiToken || !phoneNumberId) {
    console.log(`\n======================================================
[WHATSAPP SANDBOX SIMULATOR]
To: ${recipientPhone}
Payload: ${JSON.stringify(payload, null, 2)}
======================================================\n`)
    return { success: true, messageId: 'sandbox-mock-msg-id' }
  }

  // Clean recipient number (remove leading +, spaces, or dashes)
  const cleanPhone = recipientPhone.replace(/[\s\-\+]/g, '')

  const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        ...payload
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || `API error with status ${response.status}`)
    }

    const messageId = data.messages?.[0]?.id
    return { success: true, messageId }

  } catch (err: any) {
    console.error(`[WhatsApp API Error] Attempt failed to send to ${recipientPhone}: ${err.message}`)
    
    // 2. Retry mechanism
    if (retriesLeft > 0) {
      console.log(`[WhatsApp SDK] Retrying send to ${recipientPhone}. Attempts remaining: ${retriesLeft}`)
      // Backoff delay
      await new Promise(res => setTimeout(res, 1000))
      return sendWhatsAppMessage(recipientPhone, payload, retriesLeft - 1)
    }

    return { success: false, error: err.message || 'Meta API transport failure' }
  }
}

/**
 * Send order receipt confirmation details to customer
 */
export async function sendOrderConfirmation(order: WhatsAppOrder) {
  if (!order.customer_phone) {
    console.log(`[WhatsApp SDK] Order #${order.order_number} has no customer phone. Skipping confirmation.`)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const trackingUrl = `${baseUrl}/order/${order.id}`

  // Prepared Meta Template payload format (Example template: order_confirmation)
  const templatePayload = {
    type: 'template',
    template: {
      name: 'order_confirmation',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.customer_name },
            { type: 'text', text: order.order_number },
            { type: 'text', text: order.restaurant_name },
            { type: 'text', text: `$${order.total.toFixed(2)}` },
            { type: 'text', text: trackingUrl }
          ]
        }
      ]
    }
  }

  // Backup simple text payload if developer has not registered custom templates in Meta console
  const textPayload = {
    type: 'text',
    text: {
      body: `Hi ${order.customer_name},\n\nYour order #${order.order_number} has been received by ${order.restaurant_name}! 🍕\nTotal: $${order.total.toFixed(2)}\n\nTrack your cooking progress here in real-time: ${trackingUrl}\n\nThank you for choosing us!`
    }
  }

  // Check if env variable tells us to prioritize templates or simple text
  const payload = process.env.WHATSAPP_USE_TEMPLATES === 'true' ? templatePayload : textPayload

  console.log(`[WhatsApp SDK] Sending order confirmation to customer: ${order.customer_phone}`)
  await sendWhatsAppMessage(order.customer_phone, payload)
}

/**
 * Notify restaurant manager/staff of incoming tickets
 */
export async function sendRestaurantNewOrderNotification(order: WhatsAppOrder) {
  const staffPhone = process.env.WHATSAPP_RESTAURANT_NOTIFICATION_NUMBER
  if (!staffPhone) {
    console.log(`[WhatsApp SDK] WHATSAPP_RESTAURANT_NOTIFICATION_NUMBER not configured. Skipping restaurant alert.`)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const kitchenUrl = `${baseUrl}/admin/kitchen`
  const tableRef = order.table_number ? `Table ${order.table_number}` : 'Takeout'

  const textPayload = {
    type: 'text',
    text: {
      body: `🔔 *New Order Alert!* \n\nTicket: #${order.order_number}\nRestaurant: ${order.restaurant_name}\nReference: ${tableRef}\nTotal Bill: $${order.total.toFixed(2)}\n\nView details on the Kitchen Console: ${kitchenUrl}`
    }
  }

  console.log(`[WhatsApp SDK] Sending restaurant new order notification to: ${staffPhone}`)
  await sendWhatsAppMessage(staffPhone, textPayload)
}

/**
 * Inform customer about updates inside kitchen status stages
 */
export async function sendOrderStatusUpdate(order: WhatsAppOrder) {
  if (!order.customer_phone) {
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const trackingUrl = `${baseUrl}/order/${order.id}`

  // Convert status code to friendly status labels
  const statusLabels: Record<string, string> = {
    pending: 'Order Received',
    accepted: 'Accepted by Kitchen',
    preparing: 'Now Cooking',
    ready: 'Ready for Collection',
    served: 'Served',
    cancelled: 'Cancelled'
  }

  const friendlyStatus = statusLabels[order.status] || order.status.toUpperCase()

  const textPayload = {
    type: 'text',
    text: {
      body: `🍳 *Order Status Update!*\n\nHi ${order.customer_name}, your order #${order.order_number} from ${order.restaurant_name} has been updated to: *${friendlyStatus}*.\n\nTrack progress here: ${trackingUrl}`
    }
  }

  console.log(`[WhatsApp SDK] Sending status update to customer: ${order.customer_phone} -> ${order.status}`)
  await sendWhatsAppMessage(order.customer_phone, textPayload)
}
