-- ============================================================
-- B2B Connect - integration RLS and FK performance follow-up
-- ============================================================

create index if not exists tenant_integrations_created_by_idx
  on public.tenant_integrations(created_by)
  where created_by is not null;

create index if not exists tenant_integrations_updated_by_idx
  on public.tenant_integrations(updated_by)
  where updated_by is not null;

create index if not exists order_invoices_integration_id_idx
  on public.order_invoices(integration_id)
  where integration_id is not null;

drop policy if exists "super_admin_tenant_integrations_all" on public.tenant_integrations;
drop policy if exists "tenant_staff_manage_own_integrations" on public.tenant_integrations;
drop policy if exists "tenant_integrations_manage_access" on public.tenant_integrations;

create policy "tenant_integrations_manage_access" on public.tenant_integrations
  for all to authenticated
  using (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  )
  with check (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  );

drop policy if exists "super_admin_order_invoices_all" on public.order_invoices;
drop policy if exists "tenant_staff_manage_own_order_invoices" on public.order_invoices;
drop policy if exists "customer_read_own_order_invoices" on public.order_invoices;
drop policy if exists "order_invoices_read_access" on public.order_invoices;
drop policy if exists "order_invoices_insert_access" on public.order_invoices;
drop policy if exists "order_invoices_update_access" on public.order_invoices;
drop policy if exists "order_invoices_delete_access" on public.order_invoices;

create policy "order_invoices_read_access" on public.order_invoices
  for select to authenticated
  using (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
    or exists (
      select 1
      from public.orders o
      where o.id = order_invoices.order_id
        and o.customer_id = (select private.auth_customer_id())
    )
  );

create policy "order_invoices_insert_access" on public.order_invoices
  for insert to authenticated
  with check (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "order_invoices_update_access" on public.order_invoices
  for update to authenticated
  using (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  )
  with check (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "order_invoices_delete_access" on public.order_invoices
  for delete to authenticated
  using (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  );

drop policy if exists "super_admin_integration_sync_logs_all" on public.integration_sync_logs;
drop policy if exists "tenant_staff_read_own_sync_logs" on public.integration_sync_logs;
drop policy if exists "integration_sync_logs_read_access" on public.integration_sync_logs;
drop policy if exists "integration_sync_logs_insert_access" on public.integration_sync_logs;
drop policy if exists "integration_sync_logs_update_access" on public.integration_sync_logs;
drop policy if exists "integration_sync_logs_delete_access" on public.integration_sync_logs;

create policy "integration_sync_logs_read_access" on public.integration_sync_logs
  for select to authenticated
  using (
    (select private.auth_is_super_admin())
    or (
      (select private.auth_is_tenant_admin_or_employee())
      and tenant_id = (select private.auth_user_tenant_id())
    )
  );

create policy "integration_sync_logs_insert_access" on public.integration_sync_logs
  for insert to authenticated
  with check ((select private.auth_is_super_admin()));

create policy "integration_sync_logs_update_access" on public.integration_sync_logs
  for update to authenticated
  using ((select private.auth_is_super_admin()))
  with check ((select private.auth_is_super_admin()));

create policy "integration_sync_logs_delete_access" on public.integration_sync_logs
  for delete to authenticated
  using ((select private.auth_is_super_admin()));
