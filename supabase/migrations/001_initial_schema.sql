-- ============================================================
-- B2B Connect — Initial Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text product search

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('super_admin', 'tenant_admin', 'tenant_employee', 'customer');
create type tenant_status as enum ('active', 'inactive', 'suspended');
create type customer_status as enum ('active', 'inactive', 'pending');
create type product_status as enum ('active', 'inactive');
create type order_status as enum ('new', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled');
create type payment_method_type as enum ('cash_on_delivery', 'transfer_7', 'transfer_14', 'transfer_30', 'card_on_delivery', 'blik_on_delivery');
create type stock_status as enum ('available', 'unavailable', 'limited');
create type import_type as enum ('products', 'customers', 'prices', 'stock');
create type log_event_type as enum (
  'user_login', 'user_login_failed', 'user_logout', 'password_reset', 'password_changed',
  'account_created', 'account_deactivated',
  'order_created', 'order_status_changed', 'order_quantity_adjusted', 'order_cancelled',
  'product_created', 'product_updated', 'product_deleted',
  'price_changed', 'stock_updated',
  'customer_created', 'customer_updated', 'customer_deactivated',
  'import_completed'
);

-- ============================================================
-- TENANTS (hurtownie)
-- ============================================================

create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,       -- subdomain identifier, e.g. "mieso-kowalski"
  status      tenant_status not null default 'active',
  logo_url    text,
  brand_color text default '#2563eb',    -- hex color
  description text,
  contact_email text,
  contact_phone text,
  address     text,
  nip         text,
  notification_email text,               -- where new order emails go
  customer_message text,                 -- message shown to customers on login
  terms_text  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index tenants_slug_idx on tenants(slug);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================

create table user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid references tenants(id) on delete cascade,  -- null for super_admin
  role        user_role not null,
  first_name  text,
  last_name   text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index user_profiles_tenant_id_idx on user_profiles(tenant_id);
create index user_profiles_role_idx on user_profiles(role);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table categories (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  parent_id   uuid references categories(id) on delete set null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index categories_tenant_id_idx on categories(tenant_id);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table products (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  category_id         uuid references categories(id) on delete set null,
  name                text not null,
  sku                 text,
  description         text,
  image_url           text,
  unit                text not null default 'szt.',   -- kg, szt., opak., karton
  base_price          numeric(12,2) not null default 0,
  vat_rate            numeric(5,2) not null default 23, -- percent
  min_order_qty       numeric(10,3) not null default 1,
  order_multiple      numeric(10,3) not null default 1,
  stock_quantity      numeric(12,3),                  -- null = not tracked
  stock_status        stock_status not null default 'available',
  status              product_status not null default 'active',
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index products_tenant_id_idx on products(tenant_id);
create index products_category_id_idx on products(category_id);
create index products_sku_idx on products(tenant_id, sku);
create index products_name_trgm_idx on products using gin(name gin_trgm_ops);

-- ============================================================
-- PRICE GROUPS
-- ============================================================

create table price_groups (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index price_groups_tenant_id_idx on price_groups(tenant_id);

-- ============================================================
-- PRODUCT PRICES (individual / group overrides)
-- ============================================================

create table product_prices (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  product_id      uuid not null references products(id) on delete cascade,
  price_group_id  uuid references price_groups(id) on delete cascade,  -- null = individual customer price
  customer_id     uuid,                                                  -- set when individual, fk added after customers table
  price           numeric(12,2) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint price_target_check check (
    (price_group_id is not null and customer_id is null) or
    (price_group_id is null and customer_id is not null)
  )
);

create index product_prices_product_id_idx on product_prices(product_id);
create index product_prices_price_group_id_idx on product_prices(price_group_id);
create index product_prices_customer_id_idx on product_prices(customer_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table customers (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  user_id             uuid references auth.users(id) on delete set null, -- linked login
  company_name        text not null,
  nip                 text,
  email               text not null,
  phone               text,
  invoice_address     jsonb,             -- {street, city, postal_code, country}
  status              customer_status not null default 'pending',
  price_group_id      uuid references price_groups(id) on delete set null,
  min_order_value     numeric(12,2) default 0,
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index customers_tenant_id_idx on customers(tenant_id);
create index customers_user_id_idx on customers(user_id);
create index customers_email_idx on customers(tenant_id, email);

-- add FK from product_prices to customers (circular, added after table creation)
alter table product_prices
  add constraint product_prices_customer_id_fkey
  foreign key (customer_id) references customers(id) on delete cascade;

-- ============================================================
-- CUSTOMER DELIVERY ADDRESSES
-- ============================================================

create table customer_addresses (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  label       text,                   -- e.g. "Restauracja główna", "Magazyn"
  street      text not null,
  city        text not null,
  postal_code text not null,
  country     text not null default 'PL',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses(customer_id);

-- ============================================================
-- PAYMENT METHODS (available per tenant)
-- ============================================================

create table payment_methods (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  type        payment_method_type not null,
  label       text not null,           -- display label, e.g. "Przelew 14 dni"
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index payment_methods_tenant_id_idx on payment_methods(tenant_id);

-- ============================================================
-- CUSTOMER PAYMENT METHOD ASSIGNMENTS
-- ============================================================

create table customer_payment_methods (
  customer_id       uuid not null references customers(id) on delete cascade,
  payment_method_id uuid not null references payment_methods(id) on delete cascade,
  primary key (customer_id, payment_method_id)
);

-- ============================================================
-- PRODUCT VISIBILITY OVERRIDES
-- hidden_from: product is hidden from specific customer
-- visible_only_to: product is only visible to specific customers (whitelist)
-- ============================================================

create type visibility_rule_type as enum ('hidden_from', 'visible_only_to');

create table product_visibility_rules (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  rule_type   visibility_rule_type not null,
  created_at  timestamptz not null default now(),
  unique(product_id, customer_id)
);

-- ============================================================
-- DELIVERY SETTINGS (per tenant)
-- ============================================================

create table delivery_settings (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null unique references tenants(id) on delete cascade,
  delivery_days       int[] not null default '{1,2,3,4,5}',  -- 1=Mon..7=Sun
  order_cutoff_time   time not null default '20:00:00',       -- orders before this time = next delivery
  min_order_value     numeric(12,2) default 0,
  delivery_areas      text,
  customer_info       text,                                   -- message shown at checkout
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================

create table orders (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  customer_id         uuid not null references customers(id),
  order_number        text not null,
  status              order_status not null default 'new',
  delivery_date       date,
  delivery_address_id uuid references customer_addresses(id),
  delivery_address    jsonb,                  -- snapshot at time of order
  payment_method_id   uuid references payment_methods(id),
  customer_notes      text,
  internal_notes      text,
  subtotal_net        numeric(12,2) not null default 0,
  total_vat           numeric(12,2) not null default 0,
  total_gross         numeric(12,2) not null default 0,
  fulfilled_by        uuid references auth.users(id),
  fulfilled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index orders_number_tenant_idx on orders(tenant_id, order_number);
create index orders_tenant_id_idx on orders(tenant_id);
create index orders_customer_id_idx on orders(customer_id);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create table order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  product_name    text not null,          -- snapshot
  product_sku     text,                   -- snapshot
  product_unit    text not null,          -- snapshot
  ordered_qty     numeric(10,3) not null,
  fulfilled_qty   numeric(10,3),          -- set by tenant when adjusting
  unit_price_net  numeric(12,2) not null,
  vat_rate        numeric(5,2) not null,
  line_total_net  numeric(12,2) not null,
  customer_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index order_items_order_id_idx on order_items(order_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table audit_logs (
  id          bigserial primary key,
  tenant_id   uuid references tenants(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  event_type  log_event_type not null,
  entity_type text,                   -- 'order', 'product', 'customer', etc.
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index audit_logs_tenant_id_idx on audit_logs(tenant_id);
create index audit_logs_user_id_idx on audit_logs(user_id);
create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on audit_logs(created_at desc);

-- ============================================================
-- IMPORT LOGS
-- ============================================================

create table import_logs (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  import_type     import_type not null,
  file_name       text,
  records_total   int not null default 0,
  records_ok      int not null default 0,
  records_failed  int not null default 0,
  errors          jsonb,
  created_at      timestamptz not null default now()
);

create index import_logs_tenant_id_idx on import_logs(tenant_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at before update on tenants
  for each row execute function update_updated_at();
create trigger user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at();
create trigger products_updated_at before update on products
  for each row execute function update_updated_at();
create trigger customers_updated_at before update on customers
  for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
create trigger order_items_updated_at before update on order_items
  for each row execute function update_updated_at();
create trigger product_prices_updated_at before update on product_prices
  for each row execute function update_updated_at();

-- ============================================================
-- ORDER NUMBER GENERATION
-- ============================================================

create sequence if not exists order_number_seq;

create or replace function generate_order_number(p_tenant_id uuid)
returns text language plpgsql as $$
declare
  v_prefix text;
  v_count  bigint;
  v_date   text;
begin
  v_date := to_char(now(), 'YYYYMMDD');
  select count(*) + 1 into v_count
  from orders
  where tenant_id = p_tenant_id
    and date_trunc('day', created_at) = date_trunc('day', now());
  return v_date || '-' || lpad(v_count::text, 4, '0');
end;
$$;
