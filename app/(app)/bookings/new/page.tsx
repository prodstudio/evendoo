import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingWithEventForm } from '@/components/booking/BookingWithEventForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>
}) {
  const { listing: listingId } = await searchParams
  if (!listingId) redirect('/marketplace')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/register?redirect=/bookings/new?listing=${listingId}`)

  const [listingRes, eventsRes] = await Promise.all([
    supabase
      .from('provider_listings')
      .select('id, title, category, zone, base_price_cents, provider_id, profiles(full_name)')
      .eq('id', listingId)
      .single(),
    supabase
      .from('events')
      .select('id, title, event_type, event_date, zone, estimated_guests, budget_cents, notes')
      .eq('host_id', user.id)
      .order('event_date', { ascending: true }),
  ])

  const listing = listingRes.data
  if (!listing) redirect('/marketplace')
  if (listing.provider_id === user.id) redirect(`/providers/${listingId}`)

  const providerName = (listing.profiles as any)?.full_name ?? 'Proveedor'
  const price = (listing.base_price_cents / 100).toLocaleString('es-AR')

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 lg:pb-8 overflow-y-auto h-full">
      <Link href={`/providers/${listingId}`}
        className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: '#8C7B75' }}>
        <ChevronLeft size={16} strokeWidth={1.5} />
        Volver al perfil
      </Link>

      <h1 className="text-xl font-extrabold mb-1" style={{ color: '#1C0F0A' }}>
        Contactar a {providerName.split(' ')[0]}
      </h1>
      <p className="text-sm mb-6" style={{ color: '#8C7B75' }}>
        {listing.title} · ${price}
      </p>

      <BookingWithEventForm
        listingId={listing.id}
        listingTitle={listing.title}
        providerZone={listing.zone}
        existingEvents={eventsRes.data ?? []}
      />
    </div>
  )
}
