// Payment Abstraction Layer (Domain 24 & 25)

export type PaymentMethod = 'counter' | 'online' | 'card' | 'wallet'
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export interface PaymentIntentOptions {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerPhone?: string
  paymentMethod: PaymentMethod
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  status: PaymentStatus
  error?: string
}

export interface PaymentProvider {
  createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentResult>
  verifyPayment(transactionId: string): Promise<PaymentResult>
  refundPayment(transactionId: string, amount?: number): Promise<PaymentResult>
}

class SandboxPaymentProvider implements PaymentProvider {
  async createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentResult> {
    const isOnline = options.paymentMethod === 'online' || options.paymentMethod === 'card'
    return {
      success: true,
      transactionId: `tx-${Math.random().toString(36).substring(2, 12)}`,
      status: isOnline ? 'PAID' : 'PENDING'
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId,
      status: 'PAID'
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId,
      status: amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED'
    }
  }
}

export const activePaymentGateway: PaymentProvider = new SandboxPaymentProvider()
