-- ============================================================
-- B2B Connect - ERP/API integrations and invoices
-- ============================================================

do $$
begin
  create type public.integration_provider as enum (
    'generic_rest',
    'baselinker',
    'insert_subiekt',
    'comarch_optima',
    'comarch_xl',
    'enova365',
    'symfonia',
    'wapro',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tenant_integrations (
  id                         uuid primary key default uuid_generate_v4(),
  tenant_id                  uuid not null references public.tenants(id) on delete cascade,
  provider                   public.integration_provider not null default 'generic_rest',
  name                       text not null default 'Integracja ERP',
  is_active                  boolean not null default false,
  connection_status          text not null default 'not_configured'
                             check (connection_status in ('not_configured', 'ready', 'error', 'paused')),
  sync_mode                  text not null default 'api_pull'
                             check (sync_mode in ('api_pull', 'webhook_push', 'middleware', 'manual')),
  config                     jsonb not null default '{}'::jsonb,
  api_token_hash             text,
  webhook_secret_hash        text,
  last_order_export_at       timestamptz,
  last_invoice_import_at     timestamptz,
  last_error                 text,
  created_by                 uuid references auth.users(id) on delete set null,
  updated_by                 uuid references auth.users(id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists tenant_integrations_tenant_id_idx on public.tenant_integrations(tenant_id);
create index if not exists tenant_integrations_provider_idx on public.tenant_integrations(provider);
create index if not exists tenant_integrations_api_token_hash_idx on public.tenant_integrations(api_token_hash)
  where api_token_hash is not null;

alter table public.orders
  add column if not exists integration_id uuid references public.tenant_integrations(id) on delete set null,
  add column if not exists external_order_id text,
  add column if not exists external_order_number text,
  add column if not exists external_order_status text,
  add column if not exists exported_at timestamptz,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

create index if not exists orders_integration_id_idx on public.orders(integration_id);
create index if not exists orders_external_order_id_idx on public.orders(tenant_id, external_order_id)
  where external_order_id is not null;

create table if not exists public.order_invoices (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  order_id             uuid not null references public.orders(id) on delete cascade,
  integration_id        uuid references public.tenant_integrations(id) on delete set null,
  external_invoice_id  text,
  invoice_number       text not null,
  invoice_type         text not null default 'invoice'
                       check (invoice_type in ('invoice', 'correction', 'proforma', 'receipt')),
  invoice_date         date,
  sale_date            date,
  due_date             date,
  payment_method_label text,
  payment_status       text not null default 'unknown'
                       check (payment_status in ('unknown', 'unpaid', 'partial', 'paid', 'overdue')),
  currency             text not null default 'PLN',
  total_net            numeric(12,2),
  total_vat            numeric(12,2),
  total_gross          numeric(12,2),
  pdf_url              text,
  pdf_storage_path     text,
  raw_payload          jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, order_id, invoice_number)
);

create index if not exists order_invoices_tenant_id_idx on public.order_invoices(tenant_id);
create index if not exists order_invoices_order_id_idx on public.order_invoices(order_id);
create index if not exists order_invoices_external_invoice_id_idx on public.order_invoices(tenant_id, external_invoice_id)
  where external_invoice_id is not null;

create table if not exists public.integration_sync_logs (
  id              bigserial primary key,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  integration_id  uuid references public.tenant_integrations(id) on delete set null,
  direction       text not null check (direction in ('inbound', 'outbound')),
  entity_type     text not null,
  entity_id       uuid,
  operation       text not null,
  status          text not null check (status in ('success', 'error', 'skipped')),
  message         text,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists integration_sync_logs_tenant_id_idx on public.integration_sync_logs(tenant_id, created_at desc);
create index if not exists integration_sync_logs_integration_id_idx on public.integration_sync_logs(integration_id, created_at desc);
create index if not exists integration_sync_logs_entity_idx on public.integration_sync_logs(entity_type, entity_id);

drop trigger if exists tenant_integrations_updated_at on public.tenant_integrations;
create trigger tenant_integrations_updated_at
before update on public.tenant_integrations
for each row execute function public.update_updated_at();

drop trigger if exists order_invoices_updated_at on public.order_invoices;
create trigger order_invoices_updated_at
before update on public.order_invoices
for each row execute function public.update_updated_at();

alter table public.tenant_integrations enable row level security;
alter table public.order_invoices enable row level security;
alter table public.integration_sync_logs enable row level security;

grant select, insert, update, delete on public.tenant_integrations to authenticated;
grant select, insert, update, delete on public.order_invoices to authenticated;
grant select, insert, update, delete on public.integration_sync_logs to authenticated;
grant usage, select on sequence public.integration_sync_logs_id_seq to authenticated;
grant all on public.tenant_integrations to service_role;
grant all on public.order_invoices to service_role;
grant all on public.integration_sync_logs to service_role;
grant usage, select on sequence public.integration_sync_logs_id_seq to service_role;

drop policy if exists "super_admin_tenant_integrations_all" on public.tenant_integrations;
drop policy if exists "tenant_staff_manage_own_integrations" on public.tenant_integrations;
drop policy if exists "super_admin_order_invoices_all" on public.order_invoices;
drop policy if exists "tenant_staff_manage_own_order_invoices" on public.order_invoices;
drop policy if exists "customer_read_own_order_invoices" on public.order_invoices;
drop policy if exists "super_admin_integration_sync_logs_all" on public.integration_sync_logs;
drop policy if exists "tenant_staff_read_own_sync_logs" on public.integration_sync_logs;

create policy "super_admin_tenant_integrations_all" on public.tenant_integrations
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_integrations" on public.tenant_integrations
  for all to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and tenant_id = (select private.auth_user_tenant_id())
  )
  with check (
    (select private.auth_is_tenant_admin_or_employee())
    and tenant_id = (select private.auth_user_tenant_id())
  );

create policy "super_admin_order_invoices_all" on public.order_invoices
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_manage_own_order_invoices" on public.order_invoices
  for all to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and tenant_id = (select private.auth_user_tenant_id())
  )
  with check (
    (select private.auth_is_tenant_admin_or_employee())
    and tenant_id = (select private.auth_user_tenant_id())
  );

create policy "customer_read_own_order_invoices" on public.order_invoices
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_invoices.order_id
        and o.customer_id = (select private.auth_customer_id())
    )
  );

create policy "super_admin_integration_sync_logs_all" on public.integration_sync_logs
  for all to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "tenant_staff_read_own_sync_logs" on public.integration_sync_logs
  for select to authenticated
  using (
    (select private.auth_is_tenant_admin_or_employee())
    and tenant_id = (select private.auth_user_tenant_id())
  );

-- Tighten customer checkout: a customer must use one of their assigned active payment methods.
drop policy if exists "customer_create_own_orders" on public.orders;

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
    and payment_method_id is not null
    and exists (
      select 1
      from public.customer_payment_methods cpm
      join public.payment_methods pm on pm.id = cpm.payment_method_id
      where cpm.customer_id = (select private.auth_customer_id())
        and cpm.payment_method_id = orders.payment_method_id
        and pm.tenant_id = orders.tenant_id
        and pm.is_active = true
    )
  );
