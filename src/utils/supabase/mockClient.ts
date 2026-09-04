interface GlobalMockDB {
  restaurants: any[]
  restaurant_members: any[]
  restaurant_tables: any[]
  categories: any[]
  menu_items: any[]
  orders: any[]
  order_items: any[]
  order_item_addons: any[]
  order_feedback?: any[]
  table_reservations?: any[]
  branches?: any[]
  customer_profiles?: any[]
  inventory_items?: any[]
  suppliers?: any[]
  audit_logs?: any[]
  restaurant_settings?: any[]
}

const globalForMock = global as unknown as { mockDB: GlobalMockDB }

if (!globalForMock.mockDB) {
  globalForMock.mockDB = {
    restaurants: [
      {
        id: "bistro-rustique-id",
        name: "Bistro Rustique",
        slug: "bistro-rustique",
        description: "Authentic woodfired recipes & french bistro experience.",
        logo: "🪵",
        whatsapp_number: "+1 555-0199"
      }
    ],
    restaurant_members: [
      {
        id: "member-1",
        restaurant_id: "bistro-rustique-id",
        user_id: "mock-user-uuid",
        role: "owner"
      }
    ],
    restaurant_tables: [
      { id: "table-1-uuid", restaurant_id: "bistro-rustique-id", table_number: "1", qr_token: "tok-table-1", is_active: true },
      { id: "table-2-uuid", restaurant_id: "bistro-rustique-id", table_number: "2", qr_token: "tok-table-2", is_active: true },
      { id: "table-3-uuid", restaurant_id: "bistro-rustique-id", table_number: "3", qr_token: "tok-table-3", is_active: true },
      { id: "table-4-uuid", restaurant_id: "bistro-rustique-id", table_number: "4", qr_token: "tok-table-4", is_active: true },
      { id: "table-bar-uuid", restaurant_id: "bistro-rustique-id", table_number: "Bar-B", qr_token: "tok-table-bar", is_active: true }
    ],
    categories: [
      { id: "cat-starters", restaurant_id: "bistro-rustique-id", name: "Starters", description: "Light bites to wake up your palate", sort_order: 10, is_active: true },
      { id: "cat-mains", restaurant_id: "bistro-rustique-id", name: "Mains & Steaks", description: "Woodfired grill specialties", sort_order: 20, is_active: true },
      { id: "cat-pizzas", restaurant_id: "bistro-rustique-id", name: "Artisan Pizzas", description: "Sourdough woodfired pizzas", sort_order: 30, is_active: true },
      { id: "cat-desserts", restaurant_id: "bistro-rustique-id", name: "Desserts", description: "Sweet conclusions", sort_order: 40, is_active: true },
      { id: "cat-drinks", restaurant_id: "bistro-rustique-id", name: "Drinks", description: "Craft brews and soft press", sort_order: 50, is_active: true }
    ],
    menu_items: [
      { id: "menu-truffle-fries", restaurant_id: "bistro-rustique-id", category_id: "cat-starters", name: "Truffle Parmesan Fries", description: "Double-cooked handcut Russet potatoes, tossed in black truffle oil", price: 2700, image_url: "🍟", is_available: true, sort_order: 10 },
      { id: "menu-calamari", restaurant_id: "bistro-rustique-id", category_id: "cat-starters", name: "Woodfired Calamari", description: "Tender squid seasoned with sea salt", price: 3950, image_url: "🦑", is_available: true, sort_order: 20 },
      { id: "menu-burger", restaurant_id: "bistro-rustique-id", category_id: "cat-mains", name: "Rustique Smash Burger", description: "Two dry-aged beef patties smashed crispy with melted cheese", price: 4650, image_url: "🍔", is_available: true, sort_order: 10 },
      { id: "menu-ribeye", restaurant_id: "bistro-rustique-id", category_id: "cat-mains", name: "Dry-Aged Ribeye Steak", description: "14oz Prime bone-in ribeye chargrilled over red oak coals", price: 11800, image_url: "🥩", is_available: true, sort_order: 20 },
      { id: "menu-margherita", restaurant_id: "bistro-rustique-id", category_id: "cat-pizzas", name: "Margherita DOC Pizza", description: "Sourdough crust, San Marzano tomato sauce", price: 4200, image_url: "🍕", is_available: true, sort_order: 10 },
      { id: "menu-diavola", restaurant_id: "bistro-rustique-id", category_id: "cat-pizzas", name: "Spicy Diavola Pizza", description: "San Marzano base, fior di latte, spicy salami", price: 4950, image_url: "🌶️", is_available: true, sort_order: 20 },
      { id: "menu-tiramisu", restaurant_id: "bistro-rustique-id", category_id: "cat-desserts", name: "Classic Tiramisu", description: "Layers of espresso-soaked ladyfingers", price: 2400, image_url: "🍰", is_available: true, sort_order: 10 },
      { id: "menu-lemonade", restaurant_id: "bistro-rustique-id", category_id: "cat-drinks", name: "House Press Rosemary Lemonade", description: "Fresh squeezed Eureka lemons", price: 1550, image_url: "🍹", is_available: true, sort_order: 10 },
      { id: "menu-ipa", restaurant_id: "bistro-rustique-id", category_id: "cat-drinks", name: "Bistro Craft IPA", description: "Local artisanal brew with piney citrus finish", price: 1950, image_url: "🍺", is_available: true, sort_order: 20 }
    ],
    orders: [],
    order_items: [],
    order_item_addons: [],
    order_feedback: [],
    table_reservations: [],
    branches: [
      { id: "branch-1", restaurant_id: "bistro-rustique-id", name: "Downtown Main Flagship", code: "BR-01", address: "101 Grand Avenue", phone: "+1 555-0101", is_active: true },
      { id: "branch-2", restaurant_id: "bistro-rustique-id", name: "Uptown Express Kiosk", code: "BR-02", address: "404 North Boulevard", phone: "+1 555-0102", is_active: true }
    ],
    customer_profiles: [
      { id: "cust-1", restaurant_id: "bistro-rustique-id", name: "Sarah Jenkins", phone: "+1 555-0188", email: "sarah@example.com", points: 240, tier: "gold", total_spent: 340.50, visit_count: 12 },
      { id: "cust-2", restaurant_id: "bistro-rustique-id", name: "Alex Rivera", phone: "+1 555-0199", email: "alex@example.com", points: 80, tier: "silver", total_spent: 120.00, visit_count: 4 }
    ],
    inventory_items: [
      { id: "inv-1", restaurant_id: "bistro-rustique-id", name: "Prime Beef Patty", unit: "kg", current_stock: 45.5, min_stock_alert: 10.0, unit_cost: 8.50 },
      { id: "inv-2", restaurant_id: "bistro-rustique-id", name: "Brioche Burger Buns", unit: "pack", current_stock: 12, min_stock_alert: 15.0, unit_cost: 3.20 }
    ],
    suppliers: [
      { id: "sup-1", restaurant_id: "bistro-rustique-id", name: "Artisanal Meat Co.", contact_name: "John Miller", phone: "+1 555-0800", email: "orders@artisanalmeat.com" }
    ],
    audit_logs: [],
    restaurant_settings: [
      { id: "set-1", restaurant_id: "bistro-rustique-id", enable_loyalty: true, enable_reservations: true, enable_inventory: true, enable_ai: true, enable_payments: true, enable_multi_branch: true, currency: "USD" }
    ]
  }
}

export const mockDB = globalForMock.mockDB

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; path=/; max-age=31536000`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
}

class MockQueryBuilder {
  tableName: string
  filters: ((row: any) => boolean)[] = []
  sortCol: string = ''
  sortAsc: boolean = true
  isSingle = false
  isMaybeSingle = false
  isDelete = false
  limitVal = 0

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields?: string) {
    return this
  }

  eq(col: string, val: any) {
    this.filters.push((row) => {
      if (col.includes('.')) {
        return true
      }
      return row[col] === val
    })
    return this
  }

  gte(col: string, val: any) {
    this.filters.push((row) => {
      return new Date(row[col]) >= new Date(val)
    })
    return this
  }

  in(col: string, vals: any[]) {
    this.filters.push((row) => {
      return vals.includes(row[col])
    })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.sortCol = col
    this.sortAsc = opts?.ascending !== false
    return this
  }

  limit(val: number) {
    this.limitVal = val
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    return this
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const db = mockDB as any

      if (this.isDelete) {
        const list = db[this.tableName] || []
        const nextList = list.filter((row: any) => {
          let matches = true
          for (const filter of this.filters) {
            if (!filter(row)) {
              matches = false
              break
            }
          }
          return !matches
        })
        db[this.tableName] = nextList
        const deleteRes = { data: null, error: null }
        return onfulfilled ? onfulfilled(deleteRes) : deleteRes
      }

      let data = db[this.tableName] || []
      
      // Apply filters
      for (const filter of this.filters) {
        data = data.filter(filter)
      }

      // Apply sorting
      if (this.sortCol) {
        data = [...data].sort((a, b) => {
          const valA = a[this.sortCol]
          const valB = b[this.sortCol]
          if (typeof valA === 'number' && typeof valB === 'number') {
            return this.sortAsc ? valA - valB : valB - valA
          }
          return this.sortAsc 
            ? String(valA).localeCompare(String(valB)) 
            : String(valB).localeCompare(String(valA))
        })
      }

      // Apply limit
      if (this.limitVal > 0) {
        data = data.slice(0, this.limitVal)
      }

      const resultData = data.map((row: any) => {
        const copy = { ...row }
        
        if (this.tableName === 'menu_items') {
          const cat = db.categories.find((c: any) => c.id === row.category_id)
          copy.categories = cat || null
        }
        
        if (this.tableName === 'orders') {
          const table = db.restaurant_tables.find((t: any) => t.id === row.table_id)
          copy.restaurant_tables = table || null
          
          const items = db.order_items.filter((oi: any) => oi.order_id === row.id)
          copy.order_items = items.map((oi: any) => {
            const oiCopy = { ...oi }
            const addons = db.order_item_addons.filter((oia: any) => oia.order_item_id === oi.id)
            oiCopy.order_item_addons = addons
            return oiCopy
          })
        }

        if (this.tableName === 'restaurant_members') {
          const rest = db.restaurants.find((r: any) => r.id === row.restaurant_id)
          copy.restaurants = rest || null
        }

        return copy
      })

      let finalResult: any = { data: resultData, error: null }

      if (this.isSingle) {
        if (resultData.length === 0) {
          finalResult = { data: null, error: { message: 'Row not found' } }
        } else {
          finalResult = { data: resultData[0], error: null }
        }
      } else if (this.isMaybeSingle) {
        finalResult = { data: resultData[0] || null, error: null }
      }

      if (onfulfilled) {
        return onfulfilled(finalResult)
      }
      return finalResult
    } catch (err) {
      if (onrejected) {
        return onrejected(err)
      }
      throw err
    }
  }

  async insert(payload: any) {
    const db = mockDB as any
    const list = db[this.tableName] || []
    
    const itemsToInsert = Array.isArray(payload) ? payload : [payload]
    const inserted = itemsToInsert.map(item => {
      const newRow = { 
        id: `id-${Math.random().toString(36).substring(2, 10)}`, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item 
      }
      list.push(newRow)
      return newRow
    })

    const finalRes = { 
      data: Array.isArray(payload) ? inserted : inserted[0], 
      error: null
    }

    return {
      ...finalRes,
      select: () => ({
        single: async () => ({ data: finalRes.data, error: null })
      })
    }
  }

  async update(payload: any) {
    const db = mockDB as any
    const list = db[this.tableName] || []
    
    const matched: any[] = []
    for (let i = 0; i < list.length; i++) {
      let matches = true
      for (const filter of this.filters) {
        if (!filter(list[i])) {
          matches = false
          break
        }
      }
      if (matches) {
        list[i] = { ...list[i], ...payload, updated_at: new Date().toISOString() }
        matched.push(list[i])
      }
    }

    const finalRes = { data: matched, error: null }
    return {
      ...finalRes,
      select: () => ({
        single: async () => ({ data: matched[0] || null, error: null })
      })
    }
  }

  delete() {
    this.isDelete = true
    return this
  }
}

export class MockSupabaseClient {
  cookieStore?: any

  constructor(cookieStore?: any) {
    this.cookieStore = cookieStore
  }

  auth = {
    getUser: async () => {
      let sessionStr: string | null = null
      if (this.cookieStore) {
        const cookieObj = this.cookieStore.get('orderly_qr_mock_session')
        sessionStr = cookieObj ? cookieObj.value : null
      } else {
        sessionStr = getCookie('orderly_qr_mock_session')
      }
      
      if (sessionStr) {
        try {
          return { data: { user: JSON.parse(sessionStr) }, error: null }
        } catch {
          return { data: { user: null }, error: null }
        }
      }
      return { data: { user: null }, error: null }
    },
    signInWithPassword: async ({ email, password }: any) => {
      if (email === 'staff@bistrorustique.com' && password === 'password123') {
        const user = { id: 'mock-user-uuid', email, user_metadata: { full_name: 'Chef Michel' } }
        const userStr = JSON.stringify(user)
        if (this.cookieStore) {
          this.cookieStore.set('orderly_qr_mock_session', userStr, { path: '/', httpOnly: false })
        } else {
          setCookie('orderly_qr_mock_session', userStr)
        }
        return { data: { user }, error: null }
      }
      return { data: null, error: { message: 'Invalid credentials' } }
    },
    signOut: async () => {
      if (this.cookieStore) {
        this.cookieStore.delete('orderly_qr_mock_session')
      } else {
        deleteCookie('orderly_qr_mock_session')
      }
      return { error: null }
    },
    onAuthStateChange: (callback: any) => {
      let sessionStr = null
      if (this.cookieStore) {
        const cookieObj = this.cookieStore.get('orderly_qr_mock_session')
        sessionStr = cookieObj ? cookieObj.value : null
      } else {
        sessionStr = getCookie('orderly_qr_mock_session')
      }
      
      if (sessionStr) {
        try {
          callback('SIGNED_IN', { user: JSON.parse(sessionStr) })
        } catch {}
      } else {
        callback('SIGNED_OUT', null)
      }
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        return { data: { path }, error: null }
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' } }
      }
    })
  }

  from(tableName: string) {
    return new MockQueryBuilder(tableName)
  }

  channel(name: string) {
    return {
      on: (event: string, filter: any, callback: any) => {
        return {
          subscribe: () => {}
        }
      },
      subscribe: () => {}
    }
  }

  removeChannel(channel: any) {}
}

export function createMockClient(cookieStore?: any) {
  return new MockSupabaseClient(cookieStore)
}
