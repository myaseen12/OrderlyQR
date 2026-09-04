import crypto from 'crypto'
import { createClient } from '@/utils/supabase/server'

export type PaymentProvider = 'easypaisa' | 'jazzcash' | 'card' | 'cash'
export type PaymentStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'PAID' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'REFUND_PENDING' 
  | 'REFUNDED'

export interface PaymentRecord {
  id: string
  order_id: string
  restaurant_id: string
  branch_id?: string
  provider: PaymentProvider
  method: string
  amount: number
  currency: 'PKR'
  status: PaymentStatus
  provider_transaction_id?: string
  provider_reference?: string
  merchant_reference: string
  failure_reason?: string
  raw_response_safe?: any
  created_at: string
  updated_at: string
  paid_at?: string
  refunded_at?: string
}

/**
 * Checks if payment credentials are set in environment variables
 */
export function getPaymentProviderConfig(provider: PaymentProvider) {
  const env = process.env.PAYMENT_ENVIRONMENT || 'sandbox'
  
  if (provider === 'easypaisa') {
    const merchantId = process.env.EASYPAISA_MERCHANT_ID
    const storeId = process.env.EASYPAISA_STORE_ID
    const hashKey = process.env.EASYPAISA_HASH_KEY
    const isConfigured = Boolean(merchantId && storeId)
    
    return {
      provider: 'easypaisa',
      env,
      isConfigured,
      merchantId: merchantId || 'EP_MOCK_MERCHANT_102',
      storeId: storeId || 'EP_STORE_88',
      postUrl: env === 'production' 
        ? 'https://easypay.easypaisa.com.pk/easypay/Index.jsf' 
        : 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf',
      hashKey: hashKey || 'mock_ep_secret_key'
    }
  }

  if (provider === 'jazzcash') {
    const merchantId = process.env.JAZZCASH_MERCHANT_ID
    const password = process.env.JAZZCASH_PASSWORD
    const salt = process.env.JAZZCASH_INTEGRITY_SALT
    const isConfigured = Boolean(merchantId && password && salt)
    
    return {
      provider: 'jazzcash',
      env,
      isConfigured,
      merchantId: merchantId || 'JC_MOCK_MERCHANT_099',
      password: password || 'jc_pass_123',
      integritySalt: salt || 'mock_jc_salt_xyz',
      postUrl: env === 'production' 
        ? 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform' 
        : 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'
    }
  }

  if (provider === 'card') {
    const gatewayId = process.env.CARD_GATEWAY_ID
    const secretKey = process.env.CARD_SECRET_KEY
    const isConfigured = Boolean(gatewayId && secretKey)

    return {
      provider: 'card',
      env,
      isConfigured,
      gatewayId: gatewayId || 'CARD_GATEWAY_MOCK',
      secretKey: secretKey || 'mock_card_secret'
    }
  }

  // Cash is always enabled
  return {
    provider: 'cash',
    env,
    isConfigured: true
  }
}

/**
 * Generates JazzCash HMAC Secure Hash according to official documentation
 * Sorts all fields alphabetically and pre-pends Integrity Salt
 */
export function generateJazzCashSecureHash(params: Record<string, string>, integritySalt: string): string {
  // 1. Filter out empty fields & pp_SecureHash itself
  const sortedKeys = Object.keys(params)
    .filter(key => key !== 'pp_SecureHash' && params[key] !== '' && params[key] !== null && params[key] !== undefined)
    .sort()

  // 2. Build string separated by &
  let hashString = integritySalt
  for (const key of sortedKeys) {
    hashString += `&${params[key]}`
  }

  // 3. Generate SHA256 HMAC
  return crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex').toUpperCase()
}

/**
 * Generates EasyPaisa Secure Hash according to official merchant guide
 */
export function generateEasyPaisaHash(params: Record<string, string>, hashKey: string): string {
  const sortedKeys = Object.keys(params).sort()
  let hashString = ''
  for (const key of sortedKeys) {
    if (params[key]) {
      hashString += `${key}=${params[key]}&`
    }
  }
  hashString += `hashKey=${hashKey}`
  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase()
}

/**
 * Recalculates order price on the server to prevent client-side manipulation
 */
export async function verifyAndCalculateOrderTotal(
  supabase: any,
  restaurantId: string,
  cartItems: { itemId: string; quantity: number; selectedAddons?: { name: string; price: number }[] }[],
  couponDiscount: number = 0
): Promise<{ success: boolean; subtotal: number; serviceFee: number; discount: number; total: number; error?: string }> {
  
  if (!cartItems || cartItems.length === 0) {
    return { success: false, subtotal: 0, serviceFee: 0, discount: 0, total: 0, error: 'Cart is empty.' }
  }

  const uniqueItemIds = Array.from(new Set(cartItems.map(c => c.itemId)))
  
  let { data: dbItems, error: itemsErr } = await supabase
    .from('menu_items')
    .select('id, name, price, is_available, restaurant_id')
    .in('id', uniqueItemIds)
    .eq('restaurant_id', restaurantId)

  // If query by restaurant_id returned missing items, attempt fallback query by ID
  if (!dbItems || dbItems.length < uniqueItemIds.length) {
    const { data: fallbackItems } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available, restaurant_id')
      .in('id', uniqueItemIds)

    if (fallbackItems && fallbackItems.length > 0) {
      dbItems = fallbackItems
    }
  }

  const foundItemIds = new Set((dbItems || []).map((i: any) => i.id))
  const missingIds = uniqueItemIds.filter(id => !foundItemIds.has(id))

  if (itemsErr || !dbItems || dbItems.length < uniqueItemIds.length) {
    console.error('[Payment Validation Failure]', {
      restaurantId,
      sentUniqueItemIds: uniqueItemIds,
      foundDbItemIds: Array.from(foundItemIds),
      missingItemIds: missingIds,
      itemsErr
    })
    return { success: false, subtotal: 0, serviceFee: 0, discount: 0, total: 0, error: `Item price validation failed. Items not found: [${missingIds.join(', ')}]` }
  }

  let subtotal = 0
  for (const item of cartItems) {
    const dbItem = dbItems.find((i: any) => i.id === item.itemId)
    if (!dbItem) return { success: false, subtotal: 0, serviceFee: 0, discount: 0, total: 0, error: 'Invalid menu item.' }
    if (!dbItem.is_available) return { success: false, subtotal: 0, serviceFee: 0, discount: 0, total: 0, error: `"${dbItem.name}" is currently unavailable.` }

    const addonsTotal = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0)
    subtotal += (Number(dbItem.price) + addonsTotal) * item.quantity
  }

  const serviceFee = subtotal > 0 ? 400 : 0
  const validDiscount = Math.min(couponDiscount, subtotal)
  const total = Math.max(0, subtotal + serviceFee - validDiscount)

  return {
    success: true,
    subtotal,
    serviceFee,
    discount: validDiscount,
    total
  }
}
