import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS } from '@/types/provider'
import { notFound } from 'next/navigation'
import { MapPin, Star, Shield, Clock, Users, CheckCircle, ChevronLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { FavoriteButton } from '@/components/provider/FavoriteButton'

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('provider_listings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const categoryLabel = CATEGORY_LABELS[listing.category as keyof typeof CATEGORY_LABELS]

  let isFavorited = false
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('host_id', user.id)
      .eq('listing_id', id)
      .maybeSingle()
    isFavorited = !!fav
  }

  // Parse description into sections
  const descLines = listing.description?.split('. ') ?? []
  const bio = descLines.slice(0, 2).join('. ') + '.'
  const extra = descLines.slice(2).join('. ')

  // Generate fake experience stats for demo
  const stats = [
    { label: 'Años de experiencia', value: '8+', icon: Star },
    { label: 'Eventos realizados', value: '200+', icon: Calendar },
    { label: 'Disponible para múltiples eventos', value: listing.multi_event ? 'Sí' : 'Por consulta', icon: Users },
  ]

  const included = [
    'Coordinación previa al evento',
    'Entrega de material dentro de los 15 días',
    'Álbum digital premium',
    'Sesión de prueba incluida',
  ]

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F3' }}>
      {/* Back */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 pt-4">
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          Volver al marketplace
        </Link>
      </div>

      {/* Cover photo — full width */}
      <div className="relative mt-4 h-56 lg:h-80 overflow-hidden" style={{ background: '#F0E6DF' }}>
        {listing.portfolio_urls?.[0] && (
          <img src={listing.portfolio_urls[0]} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(28,15,10,0.4) 100%)' }} />
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 pb-24 lg:pb-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* LEFT — main content */}
          <div className="lg:col-span-2">

            {/* Profile header */}
            <div className="relative z-10 -mt-10 lg:-mt-14 mb-6">
              {/* Avatar row + pill inline */}
              <div className="flex items-end gap-4 mb-3">
                <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-4 border-white flex-shrink-0 flex items-center justify-center text-3xl lg:text-4xl font-extrabold text-white shadow-lg"
                  style={{ background: '#E8533A' }}>
                  {listing.portfolio_urls?.[1] ? (
                    <img src={listing.portfolio_urls[1]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (listing.profiles as any)?.full_name?.[0] || '?'
                  )}
                </div>
                </div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl lg:text-2xl font-extrabold" style={{ color: '#1C0F0A' }}>
                  {listing.title}
                </h1>
                <FavoriteButton listingId={id} initialFavorited={isFavorited} isLoggedIn={!!user} size={22} />
              </div>
              <div className="flex items-center justify-between mt-0.5">
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
              <p className="leading-relaxed" style={{ color: '#1C0F0A' }}>{listing.description}</p>
            </section>

            {/* What's included */}
            <section className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
              <h2 className="font-bold text-lg mb-4" style={{ color: '#1C0F0A' }}>¿Qué incluye?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {included.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle size={16} strokeWidth={1.5} style={{ color: '#16A34A', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: '#1C0F0A' }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery */}
            {listing.portfolio_urls?.length > 0 && (
              <section className="mb-6">
                <h2 className="font-bold text-lg mb-4" style={{ color: '#1C0F0A' }}>Galería</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.portfolio_urls.map((url: string, i: number) => (
                    <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 sm:col-span-2 aspect-video' : 'aspect-square'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* RIGHT — sticky sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-28 mt-8 space-y-4">

              {/* Price card */}
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 24px rgba(232,83,58,0.1)' }}>
                <p className="text-sm mb-1" style={{ color: '#8C7B75' }}>Precio base desde</p>
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#E8533A' }}>
                  {formatARS(listing.base_price_cents)}
                </p>
                <p className="text-xs mb-6" style={{ color: '#8C7B75' }}>El precio final se acuerda con el proveedor</p>

                {user ? (
                  <Link href={`/bookings/new?listing=${id}`}
                    className="block w-full py-3.5 rounded-xl font-bold text-white text-center text-base transition-opacity hover:opacity-90"
                    style={{ background: '#E8533A' }}>
                    Contactar a {(listing.profiles as any)?.full_name?.split(' ')[0]}
                  </Link>
                ) : (
                  <Link href={`/register?redirect=/providers/${id}`}
                    className="block w-full py-3.5 rounded-xl font-bold text-white text-center text-base"
                    style={{ background: '#E8533A' }}>
                    Contactar
                  </Link>
                )}

                <p className="text-xs text-center mt-3" style={{ color: '#8C7B75' }}>
                  Sin cargo hasta que acordés el servicio
                </p>
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>Por qué reservar en Evendoo</h3>
                {[
                  { icon: Shield, text: 'Seña protegida hasta el día del evento' },
                  { icon: Clock, text: 'Pago del saldo liberado al confirmar llegada' },
                  { icon: CheckCircle, text: 'Coordinación centralizada por chat' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon size={16} strokeWidth={1.5} style={{ color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
                    <p className="text-sm" style={{ color: '#1C0F0A' }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Quick info */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1C0F0A' }}>Información rápida</h3>
                <div className="space-y-3">
                  <Row label="Categoría" value={categoryLabel} />
                  <Row label="Años de experiencia" value="8+" />
                  <Row label="Eventos realizados" value="200+" />
                  <Row label="Múltiples eventos/fecha" value={listing.multi_event ? 'Sí' : 'No'} />
                  <Row label="Disponibilidad" value="Consultar fechas" />
                </div>
              </div>

              {/* Zones — sidebar */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#1C0F0A' }}>Zonas donde trabajo</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.zone.split(',').map((z: string) => (
                    <span key={z} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ background: '#FFF0ED', color: '#E8533A' }}>
                      <MapPin size={11} strokeWidth={1.5} />
                      {z.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 lg:hidden">
        <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3"
          style={{ boxShadow: '0 -4px 24px rgba(28,15,10,0.1)' }}>
          <div>
            <p className="text-xs" style={{ color: '#8C7B75' }}>desde</p>
            <p className="font-extrabold" style={{ color: '#E8533A' }}>{formatARS(listing.base_price_cents)}</p>
          </div>
          <Link href={user ? `/bookings/new?listing=${id}` : `/register?redirect=/providers/${id}`}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: '#E8533A' }}>
            Contactar
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm" style={{ color: '#8C7B75' }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: '#1C0F0A' }}>{value}</span>
    </div>
  )
}
