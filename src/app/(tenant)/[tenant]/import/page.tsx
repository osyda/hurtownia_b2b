import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportPanel } from '@/components/tenant/import-panel'

export default async function ImportPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('name')

  const { data: importLogs } = await supabase
    .from('import_logs')
    .select('id, import_type, records_total, records_ok, records_failed, created_at, errors')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <ImportPanel
      tenantSlug={tenantSlug}
      categories={categories ?? []}
      importLogs={importLogs ?? []}
    />
  )
}
