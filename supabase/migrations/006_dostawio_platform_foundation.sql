-- ============================================================
-- Dostawio platform foundation
-- ============================================================

do $$
begin
  alter table public.tenants
    add constraint tenants_slug_platform_safe_check
    check (
      slug ~ '^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$'
      and slug not in (
        'admin',
        'api',
        'app',
        'assets',
        'cdn',
        'docs',
        'help',
        'mail',
        'panel',
        'static',
        'status',
        'support',
        'www'
      )
    );
exception
  when duplicate_object then null;
end $$;

create unique index if not exists payment_methods_tenant_type_idx
  on public.payment_methods(tenant_id, type);

update public.tenants
set notification_email = contact_email
where notification_email is null
  and contact_email is not null;

with default_payment_methods(type, label, sort_order) as (
  values
    ('transfer_7'::public.payment_method_type, 'Przelew 7 dni', 10),
    ('transfer_14'::public.payment_method_type, 'Przelew 14 dni', 20),
    ('transfer_30'::public.payment_method_type, 'Przelew 30 dni', 30),
    ('cash_on_delivery'::public.payment_method_type, 'Gotówka przy dostawie', 40)
)
insert into public.payment_methods (tenant_id, type, label, sort_order, is_active)
select
  t.id,
  dpm.type,
  dpm.label,
  dpm.sort_order,
  true
from public.tenants t
cross join default_payment_methods dpm
where not exists (
  select 1
  from public.payment_methods pm
  where pm.tenant_id = t.id
    and pm.type = dpm.type
);
