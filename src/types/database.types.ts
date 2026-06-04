export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_employee' | 'customer'
export type TenantStatus = 'active' | 'inactive' | 'suspended'
export type CustomerStatus = 'active' | 'inactive' | 'pending'
export type ProductStatus = 'active' | 'inactive'
export type OrderStatus = 'new' | 'accepted' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethodType = 'cash_on_delivery' | 'transfer_7' | 'transfer_14' | 'transfer_30' | 'card_on_delivery' | 'blik_on_delivery'
export type StockStatus = 'available' | 'unavailable' | 'limited'
export type ImportType = 'products' | 'customers' | 'prices' | 'stock'
export type VisibilityRuleType = 'hidden_from' | 'visible_only_to'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  logo_url: string | null
  brand_color: string
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  nip: string | null
  notification_email: string | null
  customer_message: string | null
  terms_text: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  tenant_id: string | null
  role: UserRole
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  sku: string | null
  description: string | null
  image_url: string | null
  unit: string
  base_price: number
  vat_rate: number
  min_order_qty: number
  order_multiple: number
  stock_quantity: number | null
  stock_status: StockStatus
  status: ProductStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PriceGroup {
  id: string
  tenant_id: string
  name: string
  description: string | null
  created_at: string
}

export interface ProductPrice {
  id: string
  tenant_id: string
  product_id: string
  price_group_id: string | null
  customer_id: string | null
  price: number
  created_at: string
  updated_at: string
}

export interface Address {
  street: string
  city: string
  postal_code: string
  country: string
}

export interface Customer {
  id: string
  tenant_id: string
  user_id: string | null
  company_name: string
  nip: string | null
  email: string
  phone: string | null
  invoice_address: Address | null
  status: CustomerStatus
  price_group_id: string | null
  min_order_value: number
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string | null
  street: string
  city: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
}

export interface PaymentMethod {
  id: string
  tenant_id: string
  type: PaymentMethodType
  label: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface DeliverySettings {
  id: string
  tenant_id: string
  delivery_days: number[]
  order_cutoff_time: string
  min_order_value: number
  delivery_areas: string | null
  customer_info: string | null
  updated_at: string
}

export interface Order {
  id: string
  tenant_id: string
  customer_id: string
  order_number: string
  status: OrderStatus
  delivery_date: string | null
  delivery_address_id: string | null
  delivery_address: Address | null
  payment_method_id: string | null
  customer_notes: string | null
  internal_notes: string | null
  subtotal_net: number
  total_vat: number
  total_gross: number
  fulfilled_by: string | null
  fulfilled_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  product_unit: string
  ordered_qty: number
  fulfilled_qty: number | null
  unit_price_net: number
  vat_rate: number
  line_total_net: number
  customer_notes: string | null
  created_at: string
  updated_at: string
}

// Enriched types for UI
export interface OrderWithCustomer extends Order {
  customer: Pick<Customer, 'id' | 'company_name' | 'email' | 'phone'>
  items: OrderItem[]
  payment_method: PaymentMethod | null
}

export interface ProductWithCategory extends Product {
  category: Category | null
  customer_price?: number  // resolved price for a specific customer
}

export interface CustomerWithDetails extends Customer {
  price_group: PriceGroup | null
  addresses: CustomerAddress[]
  payment_methods: PaymentMethod[]
}
