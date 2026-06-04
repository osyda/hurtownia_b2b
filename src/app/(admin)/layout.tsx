import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client to bypass RLS — ensures profile is always readable
  const adminSupabase = await createAdminClient()
  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Redirect to /login (not /) to avoid loop with root page
  if (!profile || profile.role !== 'super_admin') redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
