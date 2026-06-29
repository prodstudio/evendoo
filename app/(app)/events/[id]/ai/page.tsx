import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AIPlannerShell } from '@/components/ai/AIPlannerShell'

export const dynamic = 'force-dynamic'

export default async function AIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  const { data: session } = await supabase
    .from('ai_sessions')
    .select('*')
    .eq('host_id', user.id)
    .eq('event_id', id)
    .eq('status', 'active')
    .maybeSingle()

  return <AIPlannerShell event={event} initialSession={session} userId={user.id} />
}
