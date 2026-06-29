import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import { ConversationsLayout } from '@/components/shared/ConversationsLayout'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default async function BookingsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, category, portfolio_urls),
      provider:profiles!provider_id(full_name),
      messages(id, body, created_at, sender_id, booking_id, attachment_url, attachment_type)
    `)
    .or(`host_id.eq.${profile?.id},provider_id.eq.${profile?.id}`)
    .order('updated_at', { ascending: false })

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-20 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FFF0ED' }}>
            <MessageCircle size={28} strokeWidth={1.5} style={{ color: '#E8533A' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#1C0F0A' }}>Sin conversaciones</h2>
          <p className="text-sm mb-6" style={{ color: '#8C7B75' }}>
            Cuando contactes a un proveedor, el chat aparece acá
          </p>
          <Link href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: '#E8533A' }}>
            Explorar proveedores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ConversationsLayout
      bookings={bookings as any}
      currentUserId={profile!.id}
    />
  )
}
