-- ============================================================
-- B2B Connect - Security hardening
-- ============================================================

-- Keep helper functions out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Move pg_trgm out of public when it was installed there.
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_trgm'
      and n.nspname = 'public'
  ) then
    alter extension pg_trgm set schema extensions;
  end if;
end $$;

-- Security-definer helpers used only by RLS policies.
create or replace function private.auth_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select up.role
  from public.user_profiles up
  where up.id = (select auth.uid())
    and up.is_active = true
$$;

create or replace function private.auth_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select up.tenant_id
  from public.user_profiles up
  where up.id = (select auth.uid())
    and up.is_active = true
$$;

create or replace function private.auth_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = (select auth.uid())
      and up.role = 'super_admin'
      and up.is_active = true
  )
$$;

create or replace function private.auth_is_tenant_admin_or_employee()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = (select auth.uid())
      and up.role in ('tenant_admin', 'tenant_employee')
      and up.is_active = true
  )
$$;

create or replace function private.auth_customer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.customers c
  where c.user_id = (select auth.uid())
    and c.status = 'active'
  limit 1
$$;

create or replace function private.auth_customer_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.tenant_id
  from public.customers c
  where c.user_id = (select auth.uid())
    and c.status = 'active'
  limit 1
$$;

create or replace function private.auth_customer_price_group_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.price_group_id
  from public.customers c
  where c.user_id = (select auth.uid())
    and c.status = 'active'
  limit 1
$$;

create or replace function private.customer_can_read_product(
  p_product_id uuid,
  p_customer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    join public.customers c on c.id = p_customer_id
    where p.id = p_product_id
      and p.tenant_id = c.tenant_id
      and p.status = 'active'
      and c.status = 'active'
      and not exists (
        select 1
        from public.product_visibility_rules r
        where r.product_id = p.id
          and r.customer_id = c.id
          and r.rule_type = 'hidden_from'
      )
      and (
        not exists (
          select 1
          from public.product_visibility_rules r
          where r.product_id = p.id
            and r.rule_type = 'visible_only_to'
        )
        or exists (
          select 1
          from public.product_visibility_rules r
          where r.product_id = p.id
            and r.customer_id = c.id
            and r.rule_type = 'visible_only_to'
        )
      )
  )
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

-- Lock down old exposed helper functions after policies stop using them.
alter function public.update_updated_at() set search_path = public, pg_temp;
alter function public.generate_order_number(uuid) set search_path = public, pg_temp;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'alter function public.rls_auto_enable() set search_path = pg_catalog';
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
    execute 'grant execute on function public.rls_auto_enable() to service_role';
  end if;
end $$;

-- Indexes for foreign keys and RLS joins.
drop index if exists public.tenants_slug_idx;
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists customers_price_group_id_idx on public.customers(price_group_id);
create index if not exists customer_payment_methods_payment_method_id_idx on public.customer_payment_methods(payment_method_id);
create index if not exists import_logs_user_id_idx on public.import_logs(user_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists orders_delivery_address_id_idx on public.orders(delivery_address_id);
create index if not exists orders_payment_method_id_idx on public.orders(payment_method_id);
create index if not exists orders_fulfilled_by_idx on public.orders(fulfilled_by);
create index if not exists product_prices_tenant_id_idx on public.product_prices(tenant_id);
create index if not exists product_visibility_rules_tenant_id_idx on public.product_visibility_rules(tenant_id);
create index if not exists product_visibility_rules_customer_id_idx on public.product_visibility_rules(customer_id);

-- Enable RLS on every application table.
alter table public.tenants                  enable row level security;
alter table public.user_profiles            enable row level security;
alter table public.categories               enable row level security;
alter table public.products                 enable row level security;
alter table public.price_groups             enable row level security;
alter table public.product_prices           enable row level security;
alter table public.customers                enable row level security;
alter table public.customer_addresses       enable row level security;
alter table public.payment_methods          enable row level security;
alter table public.customer_payment_methods enable row level security;
alter table public.product_visibility_rules enable row level security;
alter table public.delivery_settings        enable row level security;
alter table public.orders                   enable row level security;
alter table public.order_items              enable row level security;
alter table public.audit_logs               enable row level security;
alter table public.import_logs              enable row level security;

-- Drop previous permissive public-role policies.
drop policy if exists "super_admin_tenants_all" on public.tenants;
drop policy if exists "tenant_staff_read_own" on public.tenants;
drop policy if exists "customer_read_own_tenant" on public.tenants;

drop policy if exists "super_admin_user_profiles_all" on public.user_profiles;
drop policy if exists "tenant_admin_manage_own_tenant_profiles" on public.user_profiles;
drop policy if exists "user_read_own_profile" on public.user_profiles;

drop policy if exists "super_admin_categories_all" on public.categories;
drop policy if exists "tenant_staff_manage_own_categories" on public.categories;
drop policy if exists "customer_read_own_tenant_categories" on public.categories;

drop policy if exists "super_admin_products_all" on public.products;
drop policy if exists "tenant_staff_manage_own_products" on public.products;
drop policy if exists "customer_read_own_tenant_products" on public.products;

drop policy if exists "super_admin_price_groups_all" on public.price_groups;
drop policy if exists "tenant_staff_manage_own_price_groups" on public.price_groups;

drop policy if exists "super_admin_product_prices_all" on public.product_prices;
drop policy if exists "tenant_staff_manage_own_prices" on public.product_prices;
drop policy if exists "customer_read_own_prices" on public.product_prices;

drop policy if exists "super_admin_customers_all" on public.customers;
drop policy if exists "tenant_staff_manage_own_customers" on public.customers;
drop policy if exists "customer_read_own_record" on public.customers;

drop policy if exists "super_admin_addresses_all" on public.customer_addresses;
drop policy if exists "tenant_staff_manage_addresses" on public.customer_addresses;
drop policy if exists "customer_manage_own_addresses" on public.customer_addresses;

drop policy if exists "super_admin_payment_methods_all" on public.payment_methods;
drop policy if exists "tenant_staff_manage_payment_methods" on public.payment_methods;
drop policy if exists "customer_read_payment_methods" on public.payment_methods;

drop policy if exists "super_admin_cpm_all" on public.customer_payment_methods;
drop policy if exists "tenant_staff_manage_cpm" on public.customer_payment_methods;
drop policy if exists "customer_read_own_cpm" on public.customer_payment_methods;

drop policy if exists "super_admin_visibility_all" on public.product_visibility_rules;
drop policy if exists "tenant_staff_manage_visibility" on public.product_visibility_rules;

drop policy if exists "super_admin_delivery_all" on public.delivery_settings;
drop policy if exists "tenant_staff_manage_delivery" on public.delivery_settings;
drop policy if exists "customer_read_delivery_settings" on public.delivery_settings;

drop policy if exists "super_admin_orders_all" on public.orders;
drop policy if exists "tenant_staff_manage_own_orders" on public.orders;
drop policy if exists "customer_manage_own_orders" on public.orders;
drop policy if exists "customer_read_own_orders" on public.orders;
drop policy if exists "customer_create_own_orders" on public.orders;

drop policy if exists "super_admin_order_items_all" on public.order_items;
drop policy if exists "tenant_staff_manage_own_order_items" on public.order_items;
drop policy if exists "customer_manage_own_order_items" on public.order_items;
drop policy if exists "customer_read_own_order_items" on public.order_items;
drop policy if exists "customer_create_own_order_items" on public.order_items;

drop policy if exists "super_admin_audit_all" on public.audit_logs;
drop policy if exists "tenant_admin_read_own_audit" on public.audit_logs;

drop policy if exists "super_admin_import_logs_all" on public.import_logs;
drop policy if exists "tenant_staff_manage_own_import_logs" on public.import_logs;

-- TENANTS
create policy "super_admin_tenants_all" on public.tenants
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_read_own" on public.tenants
  for select to authenticated
  using (id = (select private.auth_user_tenant_id()));

create policy "customer_read_own_tenant" on public.tenants
  for select to authenticated
  using (id = (select private.auth_customer_tenant_id()));

-- USER PROFILES
create policy "super_admin_user_profiles_all" on public.user_profiles
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_admin_manage_own_tenant_profiles" on public.user_profiles
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_user_role()) = 'tenant_admin'
    and role <> 'super_admin'
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_user_role()) = 'tenant_admin'
    and role <> 'super_admin'
  );

create policy "user_read_own_profile" on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- CATEGORIES
create policy "super_admin_categories_all" on public.categories
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_categories" on public.categories
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

create policy "customer_read_own_tenant_categories" on public.categories
  for select to authenticated
  using (
    tenant_id = (select private.auth_customer_tenant_id())
    and is_active = true
  );

-- PRODUCTS
create policy "super_admin_products_all" on public.products
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_products" on public.products
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

create policy "customer_read_own_tenant_products" on public.products
  for select to authenticated
  using ((select private.customer_can_read_product(id, (select private.auth_customer_id()))));

-- PRICE GROUPS
create policy "super_admin_price_groups_all" on public.price_groups
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_price_groups" on public.price_groups
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

-- PRODUCT PRICES
create policy "super_admin_product_prices_all" on public.product_prices
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_prices" on public.product_prices
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.products p
      where p.id = product_prices.product_id
        and p.tenant_id = product_prices.tenant_id
    )
    and (
      (
        product_prices.customer_id is not null
        and exists (
          select 1 from public.customers c
          where c.id = product_prices.customer_id
            and c.tenant_id = product_prices.tenant_id
        )
      )
      or (
        product_prices.price_group_id is not null
        and exists (
          select 1 from public.price_groups pg
          where pg.id = product_prices.price_group_id
            and pg.tenant_id = product_prices.tenant_id
        )
      )
    )
  );

create policy "customer_read_own_prices" on public.product_prices
  for select to authenticated
  using (
    tenant_id = (select private.auth_customer_tenant_id())
    and (
      customer_id = (select private.auth_customer_id())
      or price_group_id = (select private.auth_customer_price_group_id())
    )
  );

-- CUSTOMERS
create policy "super_admin_customers_all" on public.customers
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_customers" on public.customers
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

create policy "customer_read_own_record" on public.customers
  for select to authenticated
  using (id = (select private.auth_customer_id()));

-- CUSTOMER ADDRESSES
create policy "super_admin_addresses_all" on public.customer_addresses
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_addresses" on public.customer_addresses
  for all to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.customers c
      where c.id = customer_addresses.customer_id
        and c.tenant_id = (select private.auth_user_tenant_id())
    )
  )
  with check (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.customers c
      where c.id = customer_addresses.customer_id
        and c.tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "customer_manage_own_addresses" on public.customer_addresses
  for all to authenticated
  using (customer_id = (select private.auth_customer_id()))
  with check (customer_id = (select private.auth_customer_id()));

-- PAYMENT METHODS
create policy "super_admin_payment_methods_all" on public.payment_methods
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_payment_methods" on public.payment_methods
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

create policy "customer_read_payment_methods" on public.payment_methods
  for select to authenticated
  using (
    tenant_id = (select private.auth_customer_tenant_id())
    and is_active = true
  );

-- CUSTOMER PAYMENT METHODS
create policy "super_admin_cpm_all" on public.customer_payment_methods
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_cpm" on public.customer_payment_methods
  for all to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1
      from public.customers c
      join public.payment_methods pm on pm.id = customer_payment_methods.payment_method_id
      where c.id = customer_payment_methods.customer_id
        and c.tenant_id = pm.tenant_id
        and c.tenant_id = (select private.auth_user_tenant_id())
    )
  )
  with check (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1
      from public.customers c
      join public.payment_methods pm on pm.id = customer_payment_methods.payment_method_id
      where c.id = customer_payment_methods.customer_id
        and c.tenant_id = pm.tenant_id
        and c.tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "customer_read_own_cpm" on public.customer_payment_methods
  for select to authenticated
  using (customer_id = (select private.auth_customer_id()));

-- PRODUCT VISIBILITY RULES
create policy "super_admin_visibility_all" on public.product_visibility_rules
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_visibility" on public.product_visibility_rules
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.products p
      where p.id = product_visibility_rules.product_id
        and p.tenant_id = product_visibility_rules.tenant_id
    )
    and exists (
      select 1 from public.customers c
      where c.id = product_visibility_rules.customer_id
        and c.tenant_id = product_visibility_rules.tenant_id
    )
  );

-- DELIVERY SETTINGS
create policy "super_admin_delivery_all" on public.delivery_settings
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_delivery" on public.delivery_settings
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

create policy "customer_read_delivery_settings" on public.delivery_settings
  for select to authenticated
  using (tenant_id = (select private.auth_customer_tenant_id()));

-- ORDERS
create policy "super_admin_orders_all" on public.orders
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_orders" on public.orders
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.customers c
      where c.id = orders.customer_id
        and c.tenant_id = orders.tenant_id
    )
  );

create policy "customer_read_own_orders" on public.orders
  for select to authenticated
  using (customer_id = (select private.auth_customer_id()));

create policy "customer_create_own_orders" on public.orders
  for insert to authenticated
  with check (
    tenant_id = (select private.auth_customer_tenant_id())
    and customer_id = (select private.auth_customer_id())
    and status = 'new'
    and (
      delivery_address_id is null
      or exists (
        select 1 from public.customer_addresses ca
        where ca.id = orders.delivery_address_id
          and ca.customer_id = (select private.auth_customer_id())
      )
    )
    and (
      payment_method_id is null
      or exists (
        select 1 from public.payment_methods pm
        where pm.id = orders.payment_method_id
          and pm.tenant_id = orders.tenant_id
          and pm.is_active = true
      )
    )
  );

-- ORDER ITEMS
create policy "super_admin_order_items_all" on public.order_items
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_order_items" on public.order_items
  for all to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.tenant_id = (select private.auth_user_tenant_id())
    )
  )
  with check (
    (select private.auth_is_tenant_admin_or_employee())
    and exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "customer_read_own_order_items" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = (select private.auth_customer_id())
    )
  );

create policy "customer_create_own_order_items" on public.order_items
  for insert to authenticated
  with check (
    product_id is not null
    and exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = (select private.auth_customer_id())
        and o.status = 'new'
    )
    and (select private.customer_can_read_product(product_id, (select private.auth_customer_id())))
  );

-- AUDIT LOGS
create policy "super_admin_audit_all" on public.audit_logs
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_admin_read_own_audit" on public.audit_logs
  for select to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_user_role()) = 'tenant_admin'
  );

-- IMPORT LOGS
create policy "super_admin_import_logs_all" on public.import_logs
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_import_logs" on public.import_logs
  for all to authenticated
  using (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  )
  with check (
    tenant_id = (select private.auth_user_tenant_id())
    and (select private.auth_is_tenant_admin_or_employee())
  );

-- Remove exposed policy helpers after all policies point to private schema.
drop function if exists public.auth_user_role();
drop function if exists public.auth_user_tenant_id();
drop function if exists public.auth_is_super_admin();
drop function if exists public.auth_is_tenant_admin_or_employee();
drop function if exists public.auth_customer_id();
