export type UserRole = 'owner' | 'admin' | 'kitchen_staff';
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  qr_token: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
  min_selection: number;
  max_selection: number;
  items: AddonItem[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  sort_order: number;
  addons?: AddonGroup[];
}

export interface OrderItemAddon {
  id: string;
  addon_item_id: string;
  addon_name_snapshot: string;
  price_snapshot: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  notes?: string;
  addons?: OrderItemAddon[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  table?: RestaurantTable;
  items: OrderItem[];
}

// -------------------------------------------------------------
// MOCK DATA GENERATION (All prices in PKR numeric values)
// -------------------------------------------------------------

export const MOCK_RESTAURANT: Restaurant = {
  id: 'bistro-rustique-id',
  name: 'Bistro Rustique',
  slug: 'bistro-rustique',
  description: 'Artisanal woodfired pizzas, premium cuts, and handcrafted cocktails in a warm, cozy setting.',
  logo: '🪵',
  whatsapp_number: '+923001234567',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_TABLES: RestaurantTable[] = [
  { id: 'table-1-uuid', restaurant_id: MOCK_RESTAURANT.id, table_number: '1', qr_token: 'tok-table-1', is_active: true, created_at: new Date().toISOString() },
  { id: 'table-2-uuid', restaurant_id: MOCK_RESTAURANT.id, table_number: '2', qr_token: 'tok-table-2', is_active: true, created_at: new Date().toISOString() },
  { id: 'table-3-uuid', restaurant_id: MOCK_RESTAURANT.id, table_number: '3', qr_token: 'tok-table-3', is_active: true, created_at: new Date().toISOString() },
  { id: 'table-4-uuid', restaurant_id: MOCK_RESTAURANT.id, table_number: '4', qr_token: 'tok-table-4', is_active: true, created_at: new Date().toISOString() },
  { id: 'table-bar-uuid', restaurant_id: MOCK_RESTAURANT.id, table_number: 'Bar-B', qr_token: 'tok-table-bar', is_active: true, created_at: new Date().toISOString() },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-starters', restaurant_id: MOCK_RESTAURANT.id, name: 'Starters', description: 'Light bites to wake up your palate', sort_order: 10, is_active: true },
  { id: 'cat-mains', restaurant_id: MOCK_RESTAURANT.id, name: 'Mains & Steaks', description: 'Woodfired grill specialties', sort_order: 20, is_active: true },
  { id: 'cat-pizzas', restaurant_id: MOCK_RESTAURANT.id, name: 'Artisan Pizzas', description: 'Sourdough woodfired pizzas', sort_order: 30, is_active: true },
  { id: 'cat-desserts', restaurant_id: MOCK_RESTAURANT.id, name: 'Desserts', description: 'Sweet conclusions', sort_order: 40, is_active: true },
  { id: 'cat-drinks', restaurant_id: MOCK_RESTAURANT.id, name: 'Drinks', description: 'Craft brews and soft press', sort_order: 50, is_active: true },
];

const BURGER_ADDONS: AddonGroup[] = [
  {
    id: 'add-g-cheese',
    name: 'Cheese Options',
    min_selection: 0,
    max_selection: 2,
    items: [
      { id: 'add-cheddar', name: 'Aged Cheddar', price: 400, is_available: true },
      { id: 'add-gorgonzola', name: 'Blue Gorgonzola', price: 550, is_available: true },
    ]
  },
  {
    id: 'add-g-extras',
    name: 'Burger Extras',
    min_selection: 0,
    max_selection: 3,
    items: [
      { id: 'add-bacon', name: 'Crispy Beef Bacon', price: 700, is_available: true },
      { id: 'add-egg', name: 'Sunny-Side Up Egg', price: 450, is_available: true },
      { id: 'add-truffle', name: 'Truffle Mayo Drizzle', price: 300, is_available: true },
    ]
  }
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'menu-truffle-fries',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-starters',
    name: 'Truffle Parmesan Fries',
    description: 'Double-cooked handcut Russet potatoes, tossed in black truffle oil, white truffle dust, aged parmesan, and fresh rosemary.',
    price: 2700,
    image_url: '🍟',
    is_available: true,
    sort_order: 10,
  },
  {
    id: 'menu-calamari',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-starters',
    name: 'Woodfired Calamari',
    description: 'Tender squid seasoned with sea salt, cracked black pepper, smoked paprika, and charred lemon juice.',
    price: 3950,
    image_url: '🦑',
    is_available: true,
    sort_order: 20,
  },
  // Mains
  {
    id: 'menu-burger',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-mains',
    name: 'Rustique Smash Burger',
    description: 'Two dry-aged beef patties smashed crispy with melted cheese, house pickles, charred onions, and bistro sauce.',
    price: 4650,
    image_url: '🍔',
    is_available: true,
    sort_order: 10,
    addons: BURGER_ADDONS
  },
  {
    id: 'menu-ribeye',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-mains',
    name: 'Dry-Aged Ribeye Steak',
    description: '14oz Prime bone-in ribeye chargrilled over red oak coals. Topped with herb compound butter.',
    price: 11800,
    image_url: '🥩',
    is_available: true,
    sort_order: 20,
  },
  // Pizzas
  {
    id: 'menu-margherita',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-pizzas',
    name: 'Margherita DOC Pizza',
    description: 'Sourdough crust, San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil leaves, extra virgin olive oil.',
    price: 4200,
    image_url: '🍕',
    is_available: true,
    sort_order: 10,
  },
  {
    id: 'menu-diavola',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-pizzas',
    name: 'Spicy Diavola Pizza',
    description: 'San Marzano base, fior di latte, spicy salami, hot honey drizzle, fresh oregano.',
    price: 4950,
    image_url: '🌶️',
    is_available: true,
    sort_order: 20,
  },
  // Desserts
  {
    id: 'menu-tiramisu',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-desserts',
    name: 'Classic Tiramisu',
    description: 'Layers of espresso-soaked ladyfingers, whipped mascarpone cream, dusted with dark cocoa powder.',
    price: 2400,
    image_url: '🍰',
    is_available: true,
    sort_order: 10,
  },
  // Drinks
  {
    id: 'menu-lemonade',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-drinks',
    name: 'House Press Rosemary Lemonade',
    description: 'Fresh squeezed Eureka lemons, organic cane sugar, cold-infused rosemary sprigs, sparkling water.',
    price: 1550,
    image_url: '🍹',
    is_available: true,
    sort_order: 10,
  },
  {
    id: 'menu-ipa',
    restaurant_id: MOCK_RESTAURANT.id,
    category_id: 'cat-drinks',
    name: 'Bistro Craft IPA',
    description: 'Local artisanal brew with piney and citrusy aroma, medium body, crisp bitter finish.',
    price: 1950,
    image_url: '🍺',
    is_available: true,
    sort_order: 20,
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1-uuid',
    restaurant_id: MOCK_RESTAURANT.id,
    table_id: 'table-1-uuid',
    order_number: 'ORD-0245',
    customer_name: 'Alex Johnson',
    status: 'pending',
    subtotal: 8900,
    total: 9300,
    notes: 'Burger medium rare, please. Sauce on the side.',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    table: MOCK_TABLES[0],
    items: [
      {
        id: 'ord-item-1',
        order_id: 'order-1-uuid',
        menu_item_id: 'menu-burger',
        item_name_snapshot: 'Rustique Smash Burger',
        price_snapshot: 4650,
        quantity: 1,
        notes: 'Medium rare',
        addons: [
          { id: 'addon-1', addon_item_id: 'add-cheddar', addon_name_snapshot: 'Aged Cheddar', price_snapshot: 400 }
        ]
      },
      {
        id: 'ord-item-2',
        order_id: 'order-1-uuid',
        menu_item_id: 'menu-truffle-fries',
        item_name_snapshot: 'Truffle Parmesan Fries',
        price_snapshot: 2700,
        quantity: 1,
      },
      {
        id: 'ord-item-3',
        order_id: 'order-1-uuid',
        menu_item_id: 'menu-lemonade',
        item_name_snapshot: 'House Press Rosemary Lemonade',
        price_snapshot: 1550,
        quantity: 1,
      }
    ]
  },
  {
    id: 'order-2-uuid',
    restaurant_id: MOCK_RESTAURANT.id,
    table_id: 'table-3-uuid',
    order_number: 'ORD-0241',
    customer_name: 'Elena Rostova',
    status: 'preparing',
    subtotal: 13900,
    total: 14300,
    notes: 'No ice in the lemonade.',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    table: MOCK_TABLES[2],
    items: [
      {
        id: 'ord-item-4',
        order_id: 'order-2-uuid',
        menu_item_id: 'menu-margherita',
        item_name_snapshot: 'Margherita DOC Pizza',
        price_snapshot: 4200,
        quantity: 2,
      },
      {
        id: 'ord-item-5',
        order_id: 'order-2-uuid',
        menu_item_id: 'menu-lemonade',
        item_name_snapshot: 'House Press Rosemary Lemonade',
        price_snapshot: 1550,
        quantity: 2,
      },
      {
        id: 'ord-item-6',
        order_id: 'order-2-uuid',
        menu_item_id: 'menu-tiramisu',
        item_name_snapshot: 'Classic Tiramisu',
        price_snapshot: 2400,
        quantity: 1,
      }
    ]
  },
  {
    id: 'order-3-uuid',
    restaurant_id: MOCK_RESTAURANT.id,
    table_id: 'table-2-uuid',
    order_number: 'ORD-0240',
    customer_name: 'Marcus Brody',
    status: 'ready',
    subtotal: 13750,
    total: 14150,
    notes: 'ASAP, table is in a hurry.',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    table: MOCK_TABLES[1],
    items: [
      {
        id: 'ord-item-7',
        order_id: 'order-3-uuid',
        menu_item_id: 'menu-ribeye',
        item_name_snapshot: 'Dry-Aged Ribeye Steak',
        price_snapshot: 11800,
        quantity: 1,
        notes: 'Medium well',
      },
      {
        id: 'ord-item-8',
        order_id: 'order-3-uuid',
        menu_item_id: 'menu-ipa',
        item_name_snapshot: 'Bistro Craft IPA',
        price_snapshot: 1950,
        quantity: 1,
      }
    ]
  },
  {
    id: 'order-4-uuid',
    restaurant_id: MOCK_RESTAURANT.id,
    table_id: 'table-bar-uuid',
    order_number: 'ORD-0238',
    customer_name: 'Sarah Connor',
    status: 'served',
    subtotal: 4650,
    total: 5050,
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    table: MOCK_TABLES[4],
    items: [
      {
        id: 'ord-item-9',
        order_id: 'order-4-uuid',
        menu_item_id: 'menu-burger',
        item_name_snapshot: 'Rustique Smash Burger',
        price_snapshot: 4650,
        quantity: 1,
      }
    ]
  }
];
