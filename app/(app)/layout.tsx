import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/shared/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return <AppShell profile={profile}>{children}</AppShell>
}
