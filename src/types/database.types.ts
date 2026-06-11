export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_employee' | 'customer'
export type TenantStatus = 'active' | 'inactive' | 'suspended'
export type CustomerStatus = 'active' | 'inactive' | 'pending'
export type ProductStatus = 'active' | 'inactive'
export type OrderStatus = 'new' | 'accepted' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethodType = 'cash_on_delivery' | 'transfer_7' | 'transfer_14' | 'transfer_30' | 'card_on_delivery' | 'blik_on_delivery'
export type StockStatus = 'available' | 'unavailable' | 'limited'
export type ImportType = 'products' | 'customers' | 'prices' | 'stock'
export type VisibilityRuleType = 'hidden_from' | 'visible_only_to'
export type IntegrationProvider = 'generic_rest' | 'baselinker' | 'insert_subiekt' | 'comarch_optima' | 'comarch_xl' | 'enova365' | 'symfonia' | 'wapro' | 'custom'

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
  delivery_window: string | null
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
  integration_id?: string | null
  external_order_id?: string | null
  external_order_number?: string | null
  external_order_status?: string | null
  exported_at?: string | null
  external_payload?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TenantIntegration {
  id: string
  tenant_id: string
  provider: IntegrationProvider
  name: string
  is_active: boolean
  connection_status: 'not_configured' | 'ready' | 'error' | 'paused'
  sync_mode: 'api_pull' | 'webhook_push' | 'middleware' | 'manual'
  config: Record<string, unknown>
  api_token_hash: string | null
  webhook_secret_hash: string | null
  last_order_export_at: string | null
  last_invoice_import_at: string | null
  last_error: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface OrderInvoice {
  id: string
  tenant_id: string
  order_id: string
  integration_id: string | null
  external_invoice_id: string | null
  invoice_number: string
  invoice_type: 'invoice' | 'correction' | 'proforma' | 'receipt'
  invoice_date: string | null
  sale_date: string | null
  due_date: string | null
  payment_method_label: string | null
  payment_status: 'unknown' | 'unpaid' | 'partial' | 'paid' | 'overdue'
  currency: string
  total_net: number | null
  total_vat: number | null
  total_gross: number | null
  pdf_url: string | null
  pdf_storage_path: string | null
  raw_payload: Record<string, unknown>
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
