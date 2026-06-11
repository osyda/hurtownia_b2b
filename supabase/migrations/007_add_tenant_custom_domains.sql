alter table public.tenants
  add column if not exists custom_domain text,
  add column if not exists custom_domain_status text not null default 'not_configured',
  add column if not exists custom_domain_verified_at timestamptz;

do $$
begin
  alter table public.tenants
    add constraint tenants_custom_domain_status_check
    check (custom_domain_status in ('not_configured', 'pending_dns', 'active', 'error'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists tenants_custom_domain_unique_idx
  on public.tenants (lower(custom_domain))
  where custom_domain is not null and custom_domain <> '';

create index if not exists tenants_custom_domain_status_idx
  on public.tenants (custom_domain_status);

comment on column public.tenants.custom_domain is 'Optional customer-owned domain mapped manually to this tenant, e.g. zamowienia.example.pl.';
comment on column public.tenants.custom_domain_status is 'Manual custom domain rollout status: not_configured, pending_dns, active, error.';
comment on column public.tenants.custom_domain_verified_at is 'Timestamp when the custom domain was marked active by the superadmin.';
