// AI Restaurant Assistant & Admin Copilot Service Layer (Domain 9, 10, 11)

export interface AiQueryResult {
  answer: string
  suggestedAction?: string
  dataPoints?: Record<string, any>
}

export async function askAiAssistant(
  userQuery: string,
  contextData: {
    restaurantName: string
    ordersCount: number
    todaySales: number
    topItems: string[]
  }
): Promise<AiQueryResult> {
  const queryLower = userQuery.toLowerCase()

  // Controlled, safe analytics synthesis
  if (queryLower.includes('sale') || queryLower.includes('revenue')) {
    return {
      answer: `Today's total sales for ${contextData.restaurantName} stand at $${contextData.todaySales.toFixed(2)} across ${contextData.ordersCount} completed order tickets.`,
      dataPoints: { todaySales: contextData.todaySales, ordersCount: contextData.ordersCount }
    }
  }

  if (queryLower.includes('popular') || queryLower.includes('best') || queryLower.includes('item')) {
    const itemsList = contextData.topItems.length > 0 ? contextData.topItems.join(', ') : 'Smash Burger, Woodfired Pizza'
    return {
      answer: `Your top performing dishes this week are: ${itemsList}.`,
      dataPoints: { topItems: contextData.topItems }
    }
  }

  if (queryLower.includes('recommend') || queryLower.includes('pair')) {
    return {
      answer: `For guest recommendations: We suggest pairing the Smash Burger with Craft IPA for an elevated dining experience.`,
      suggestedAction: 'Feature Burger + Craft IPA combo banner on customer menu'
    }
  }

  return {
    answer: `OrderlyQR AI Copilot: I am monitoring your dining operations at ${contextData.restaurantName}. You have recorded ${contextData.ordersCount} orders today. Ask me about sales, top items, or menu recommendations!`
  }
}
