import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EventDetailClient } from '@/components/events/EventDetailClient'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [{ data: bookings }, { data: savedListings }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, provider_listings(title, category, base_price_cents, portfolio_urls), profiles!bookings_provider_id_fkey(full_name)')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_saved_listings')
      .select('*, provider_listings(id, title, category, base_price_cents, portfolio_urls, zone, profiles(full_name))')
      .eq('event_id', id)
      .order('added_at', { ascending: false }),
  ])

  return (
    <EventDetailClient
      event={event}
      bookings={bookings ?? []}
      savedListings={savedListings ?? []}
    />
  )
}
