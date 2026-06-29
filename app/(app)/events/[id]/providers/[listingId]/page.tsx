import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS } from '@/types/provider'
import { AddToEventButton } from '@/components/events/AddToEventButton'
import { MapPin, Shield, Clock, CheckCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EventProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string; listingId: string }>
}) {
  const { id: eventId, listingId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: event }, { data: listing }] = await Promise.all([
    supabase.from('events').select('id, title').eq('id', eventId).eq('host_id', user.id).single(),
    supabase.from('provider_listings').select('*, profiles(full_name, avatar_url)').eq('id', listingId).single(),
  ])

  if (!event) notFound()
  if (!listing) notFound()

  const { data: savedRow } = await supabase
    .from('event_saved_listings')
    .select('id')
    .eq('event_id', eventId)
    .eq('listing_id', listingId)
    .maybeSingle()

  const isSaved = !!savedRow
  const categoryLabel = CATEGORY_LABELS[listing.category as keyof typeof CATEGORY_LABELS]

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FDF8F3' }}>

      {/* Back */}
      <div className="px-6 lg:px-10 pt-4 flex-shrink-0">
        <Link href={`/events/${eventId}/providers`}
          className="inline-flex items-center gap-1 text-sm font-medium"
          style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          {event.title}
        </Link>
      </div>

      {/* Cover */}
      <div className="relative mt-4 h-52 lg:h-72 overflow-hidden flex-shrink-0" style={{ background: '#F0E6DF' }}>
        {listing.portfolio_urls?.[0] && (
          <img src={listing.portfolio_urls[0]} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(28,15,10,0.4) 100%)' }} />
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto w-full px-6 lg:px-10 pb-24 lg:pb-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* LEFT */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="relative z-10 -mt-10 lg:-mt-14 mb-6">
              <div className="flex items-end gap-4 mb-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white flex items-center justify-center text-2xl font-extrabold text-white shadow-lg"
                  style={{ background: '#E8533A' }}>
                  {listing.portfolio_urls?.[1] ? (
                    <img src={listing.portfolio_urls[1]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (listing.profiles as any)?.full_name?.[0] ?? '?'
                  )}
                </div>
              </div>
              <h1 className="text-xl lg:text-2xl font-extrabold mb-1" style={{ color: '#1C0F0A' }}>
                {listing.title}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <MapPin size={13} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                  <span className="text-sm" style={{ color: '#8C7B75' }}>{listing.zone}</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: '#E8533A' }}>
                  {categoryLabel}
                </span>
              </div>
            </div>

            {/* About */}
            <section className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
              <h2 className="font-bold text-lg mb-3" style={{ color: '#1C0F0A' }}>Sobre mí</h2>
              <p className="leading-relaxed text-sm" style={{ color: '#1C0F0A' }}>{listing.description}</p>
            </section>

            {/* Gallery */}
            {listing.portfolio_urls?.length > 1 && (
              <section className="mb-6">
                <h2 className="font-bold text-lg mb-4" style={{ color: '#1C0F0A' }}>Galería</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.portfolio_urls.map((url: string, i: number) => (
                    <div key={i}
                      className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — sidebar (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6 mt-4 space-y-4">
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 24px rgba(232,83,58,0.1)' }}>
                <p className="text-sm mb-1" style={{ color: '#8C7B75' }}>Precio base desde</p>
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#E8533A' }}>
                  {formatARS(listing.base_price_cents)}
                </p>
                <p className="text-xs mb-6" style={{ color: '#8C7B75' }}>
                  Agregalo a <strong>{event.title}</strong> y decidí si contactarlo después
                </p>
                <AddToEventButton eventId={eventId} listingId={listingId} initialSaved={isSaved} />
              </div>

              <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>Por qué guardar en Evendoo</h3>
                {[
                  { icon: Shield, text: 'Agregalo sin compromiso, contactá cuando estés listo' },
                  { icon: Clock, text: 'Seña protegida hasta el día del evento' },
                  { icon: CheckCircle, text: 'Coordinación centralizada por chat' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon size={16} strokeWidth={1.5} style={{ color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
                    <p className="text-sm" style={{ color: '#1C0F0A' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 lg:hidden">
        <div className="bg-white rounded-2xl px-5 py-3" style={{ boxShadow: '0 -4px 24px rgba(28,15,10,0.1)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs" style={{ color: '#8C7B75' }}>desde</p>
              <p className="font-extrabold" style={{ color: '#E8533A' }}>{formatARS(listing.base_price_cents)}</p>
            </div>
            <span className="text-xs" style={{ color: '#8C7B75' }}>para: {event.title}</span>
          </div>
          <AddToEventButton eventId={eventId} listingId={listingId} initialSaved={isSaved} />
        </div>
      </div>
    </div>
  )
}
