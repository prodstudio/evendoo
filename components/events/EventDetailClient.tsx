"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Calendar, MapPin, Users, DollarSign, Sparkles, Plus, MessageCircle } from 'lucide-react'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'

type Props = {
  event: any
  bookings: any[]
  savedListings: any[]
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pendiente',  bg: '#FFF9E6', color: '#D97706' },
  accepted:  { label: 'Confirmado', bg: '#F0FDF4', color: '#16A34A' },
  declined:  { label: 'Declinado',  bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { label: 'Cancelado',  bg: '#F3F4F6', color: '#6B7280' },
}

export function EventDetailClient({ event, bookings, savedListings }: Props) {
  const [tab, setTab] = useState<'detalles' | 'proveedores'>('detalles')

  const eventDate = new Date(event.event_date).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Group saved listings by category
  const grouped = savedListings.reduce((acc: Record<string, any[]>, item: any) => {
    const cat: string = item.provider_listings?.category ?? 'otro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Fixed header */}
      <div className="flex-shrink-0 px-6 lg:px-10 pt-6 pb-0 bg-white border-b border-stone-100">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm mb-3 font-medium" style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          Mis Eventos
        </Link>
        <h1 className="text-xl font-extrabold mb-4" style={{ color: '#1C0F0A' }}>{event.title}</h1>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['detalles', 'proveedores'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all capitalize"
              style={{
                background: tab === t ? '#FFF0ED' : 'transparent',
                color: tab === t ? '#E8533A' : '#8C7B75',
                borderBottom: tab === t ? '2px solid #E8533A' : '2px solid transparent',
              }}>
              {t === 'detalles' ? 'Detalles' : `Proveedores ${savedListings.length > 0 ? `(${savedListings.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 pb-28 lg:pb-8">

        {/* ── TAB: DETALLES ── */}
        {tab === 'detalles' && (
          <div className="max-w-2xl">
            {/* Event info card */}
            <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
                  <Calendar size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                  {eventDate}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
                  <MapPin size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                  {event.zone} · {event.event_type}
                </div>
                {event.estimated_guests && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
                    <Users size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                    {event.estimated_guests} invitados estimados
                  </div>
                )}
                {event.budget_cents && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
                    <DollarSign size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                    Presupuesto: {formatARS(event.budget_cents)}
                  </div>
                )}
              </div>
              {event.notes && (
                <p className="text-sm mt-4 pt-4 border-t border-stone-100" style={{ color: '#8C7B75' }}>
                  {event.notes}
                </p>
              )}
            </div>

            {/* AI Planner CTA */}
            <Link href={`/events/${event.id}/ai`}
              className="flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #E8533A 0%, #FF7A5C 100%)' }}>
              <Sparkles size={20} strokeWidth={1.5} className="text-white flex-shrink-0" />
              <div>
                <p className="font-semibold text-white text-sm">Planificador IA</p>
                <p className="text-xs text-white opacity-80">Encontrá los mejores proveedores para tu evento</p>
              </div>
            </Link>

            {/* Bookings in progress */}
            {bookings.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm mb-3" style={{ color: '#1C0F0A' }}>Proveedores contactados</h2>
                <div className="space-y-3">
                  {bookings.map(b => {
                    const status = STATUS_MAP[b.status] ?? STATUS_MAP.pending
                    return (
                      <Link key={b.id} href={`/bookings/${b.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                        style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm" style={{ color: '#1C0F0A' }}>
                            {b.profiles?.full_name}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#8C7B75' }}>
                            {b.provider_listings?.title}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: PROVEEDORES ── */}
        {tab === 'proveedores' && (
          <div>
            {/* Add providers CTA */}
            <Link href={`/events/${event.id}/providers`}
              className="flex items-center gap-3 p-4 rounded-2xl mb-6 border-2 border-dashed transition-all hover:border-orange-400"
              style={{ borderColor: '#FECACA', background: '#FFF8F7' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#FFF0ED' }}>
                <Plus size={18} strokeWidth={2} style={{ color: '#E8533A' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#E8533A' }}>Buscar proveedores</p>
                <p className="text-xs" style={{ color: '#8C7B75' }}>Explorá el marketplace y agregá los que te interesan</p>
              </div>
            </Link>

            {savedListings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold mb-1" style={{ color: '#1C0F0A' }}>Todavía no agregaste proveedores</p>
                <p className="text-sm" style={{ color: '#8C7B75' }}>
                  Buscá proveedores y agregalos a tu evento para organizarlos antes de contactarlos.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(grouped).map(([category, items]) => (
                  <section key={category}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-bold text-sm" style={{ color: '#1C0F0A' }}>
                        {CATEGORY_LABELS[category as ProviderCategory] ?? category}
                      </h2>
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ background: '#F3F4F6', color: '#6B7280' }}>
                        {items.length}
                      </span>
                    </div>

                    {/* Horizontal scroll row */}
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 lg:-mx-10 lg:px-10">
                      {items.map((item: any) => (
                        <SavedProviderCard
                          key={item.id}
                          item={item}
                          eventId={event.id}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function SavedProviderCard({ item, eventId }: { item: any; eventId: string }) {
  const listing = item.provider_listings
  if (!listing) return null

  return (
    <div className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
      <div className="h-28 bg-stone-100 overflow-hidden">
        {listing.portfolio_urls?.[0] ? (
          <img src={listing.portfolio_urls[0]} alt={listing.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-xs truncate mb-0.5" style={{ color: '#1C0F0A' }}>
          {listing.title}
        </p>
        <p className="text-xs mb-2" style={{ color: '#8C7B75' }}>
          {listing.profiles?.full_name}
        </p>
        <p className="text-xs font-bold mb-3" style={{ color: '#E8533A' }}>
          desde {formatARS(listing.base_price_cents)}
        </p>
        <Link
          href={`/bookings/new?listing=${listing.id}&event_id=${eventId}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: '#E8533A' }}>
          <MessageCircle size={11} strokeWidth={2} />
          Contactar
        </Link>
      </div>
    </div>
  )
}
