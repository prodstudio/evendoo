import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChatWindow } from '@/components/shared/Chat/ChatWindow'

export const dynamic = 'force-dynamic'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, base_price_cents),
      profiles!bookings_provider_id_fkey(full_name, avatar_url),
      host_profiles:profiles!bookings_host_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()
  if (booking.host_id !== user.id && booking.provider_id !== user.id) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', id)
    .order('created_at', { ascending: true })

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const userRole: 'host' | 'provider' = booking.host_id === user.id ? 'host' : 'provider'
  const backHref = booking.event_id
    ? `/events/${booking.event_id}`
    : '/bookings'

  return (
    <ChatWindow
      booking={booking}
      initialMessages={messages ?? []}
      currentUserId={user.id}
      payment={payment}
      userRole={userRole}
      backHref={backHref}
    />
  )
}
