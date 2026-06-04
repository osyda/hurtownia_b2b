-- ============================================================
-- Row Level Security Policies
-- Multi-tenant data isolation
-- ============================================================

-- Enable RLS on all tables
alter table tenants                  enable row level security;
alter table user_profiles            enable row level security;
alter table categories               enable row level security;
alter table products                 enable row level security;
alter table price_groups             enable row level security;
alter table product_prices           enable row level security;
alter table customers                enable row level security;
alter table customer_addresses       enable row level security;
alter table payment_methods          enable row level security;
alter table customer_payment_methods enable row level security;
alter table product_visibility_rules enable row level security;
alter table delivery_settings        enable row level security;
alter table orders                   enable row level security;
alter table order_items              enable row level security;
alter table audit_logs               enable row level security;
alter table import_logs              enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function auth_user_role()
returns user_role language sql stable security definer as $$
  select role from user_profiles where id = auth.uid()
$$;

create or replace function auth_user_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from user_profiles where id = auth.uid()
$$;

create or replace function auth_is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'super_admin'
  )
$$;

create or replace function auth_is_tenant_admin_or_employee()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('tenant_admin', 'tenant_employee')
  )
$$;

-- Returns customer record for the currently logged-in customer user
create or replace function auth_customer_id()
returns uuid language sql stable security definer as $$
  select id from customers
  where user_id = auth.uid()
  limit 1
$$;

-- ============================================================
-- TENANTS
-- ============================================================

-- Super admin: full access
create policy "super_admin_tenants_all" on tenants
  for all using (auth_is_super_admin());

-- Tenant staff: read own tenant
create policy "tenant_staff_read_own" on tenants
  for select using (id = auth_user_tenant_id());

-- Customers: read own tenant (for branding)
create policy "customer_read_own_tenant" on tenants
  for select using (
    id = (select tenant_id from customers where user_id = auth.uid() limit 1)
  );

-- ============================================================
-- USER PROFILES
-- ============================================================

create policy "super_admin_user_profiles_all" on user_profiles
  for all using (auth_is_super_admin());

create policy "tenant_admin_manage_own_tenant_profiles" on user_profiles
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_user_role() = 'tenant_admin'
  );

create policy "user_read_own_profile" on user_profiles
  for select using (id = auth.uid());

-- ============================================================
-- CATEGORIES
-- ============================================================

create policy "super_admin_categories_all" on categories
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_categories" on categories
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_own_tenant_categories" on categories
  for select using (
    tenant_id = (select tenant_id from customers where user_id = auth.uid() limit 1)
    and is_active = true
  );

-- ============================================================
-- PRODUCTS
-- ============================================================

create policy "super_admin_products_all" on products
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_products" on products
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_own_tenant_products" on products
  for select using (
    tenant_id = (select tenant_id from customers where user_id = auth.uid() limit 1)
    and status = 'active'
  );

-- ============================================================
-- PRICE GROUPS
-- ============================================================

create policy "super_admin_price_groups_all" on price_groups
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_price_groups" on price_groups
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

-- ============================================================
-- PRODUCT PRICES
-- ============================================================

create policy "super_admin_product_prices_all" on product_prices
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_prices" on product_prices
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_own_prices" on product_prices
  for select using (
    customer_id = auth_customer_id()
    or price_group_id in (
      select price_group_id from customers
      where user_id = auth.uid() and price_group_id is not null
    )
  );

-- ============================================================
-- CUSTOMERS
-- ============================================================

create policy "super_admin_customers_all" on customers
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_customers" on customers
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_own_record" on customers
  for select using (user_id = auth.uid());

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================

create policy "super_admin_addresses_all" on customer_addresses
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_addresses" on customer_addresses
  for all using (
    exists (
      select 1 from customers c
      where c.id = customer_addresses.customer_id
        and c.tenant_id = auth_user_tenant_id()
    )
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_manage_own_addresses" on customer_addresses
  for all using (
    customer_id = auth_customer_id()
  );

-- ============================================================
-- PAYMENT METHODS
-- ============================================================

create policy "super_admin_payment_methods_all" on payment_methods
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_payment_methods" on payment_methods
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_payment_methods" on payment_methods
  for select using (
    tenant_id = (select tenant_id from customers where user_id = auth.uid() limit 1)
    and is_active = true
  );

-- ============================================================
-- CUSTOMER PAYMENT METHODS
-- ============================================================

create policy "super_admin_cpm_all" on customer_payment_methods
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_cpm" on customer_payment_methods
  for all using (
    exists (
      select 1 from customers c
      where c.id = customer_payment_methods.customer_id
        and c.tenant_id = auth_user_tenant_id()
    )
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_own_cpm" on customer_payment_methods
  for select using (customer_id = auth_customer_id());

-- ============================================================
-- PRODUCT VISIBILITY RULES
-- ============================================================

create policy "super_admin_visibility_all" on product_visibility_rules
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_visibility" on product_visibility_rules
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

-- ============================================================
-- DELIVERY SETTINGS
-- ============================================================

create policy "super_admin_delivery_all" on delivery_settings
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_delivery" on delivery_settings
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_read_delivery_settings" on delivery_settings
  for select using (
    tenant_id = (select tenant_id from customers where user_id = auth.uid() limit 1)
  );

-- ============================================================
-- ORDERS
-- ============================================================

create policy "super_admin_orders_all" on orders
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_orders" on orders
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_manage_own_orders" on orders
  for all using (customer_id = auth_customer_id());

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create policy "super_admin_order_items_all" on order_items
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_order_items" on order_items
  for all using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.tenant_id = auth_user_tenant_id()
    )
    and auth_is_tenant_admin_or_employee()
  );

create policy "customer_manage_own_order_items" on order_items
  for all using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.customer_id = auth_customer_id()
    )
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create policy "super_admin_audit_all" on audit_logs
  for all using (auth_is_super_admin());

create policy "tenant_admin_read_own_audit" on audit_logs
  for select using (
    tenant_id = auth_user_tenant_id()
    and auth_user_role() = 'tenant_admin'
  );

-- ============================================================
-- IMPORT LOGS
-- ============================================================

create policy "super_admin_import_logs_all" on import_logs
  for all using (auth_is_super_admin());

create policy "tenant_staff_manage_own_import_logs" on import_logs
  for all using (
    tenant_id = auth_user_tenant_id()
    and auth_is_tenant_admin_or_employee()
  );
