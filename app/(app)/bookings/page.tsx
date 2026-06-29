import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import { ConversationsLayout } from '@/components/shared/ConversationsLayout'

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) redirect('/login')

  // Hosts manage conversations inside each event — redirect them there
  if (!profile.is_provider) redirect('/events')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, category, portfolio_urls),
      provider:profiles!provider_id(full_name),
      messages(id, body, created_at, sender_id, booking_id, attachment_url, attachment_type)
    `)
    .or(`host_id.eq.${profile.id},provider_id.eq.${profile.id}`)
    .order('updated_at', { ascending: false })

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-20 max-w-sm mx-auto px-6">
          <p className="text-4xl mb-4">💬</p>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#1C0F0A' }}>Sin conversaciones</h2>
          <p className="text-sm" style={{ color: '#8C7B75' }}>
            Las conversaciones aparecerán aquí cuando los hosts te contacten.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ConversationsLayout
      bookings={bookings as any}
      currentUserId={profile.id}
    />
  )
}
