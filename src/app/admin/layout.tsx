import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminProvider } from '@/app/admin/context'
import AdminShell from '@/app/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AdminProvider initialUser={user}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  )
}
