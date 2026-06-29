"use client"

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Calendar, MapPin, Users, DollarSign, Sparkles,
  Plus, MessageCircle, X, CheckCircle, Clock,
} from 'lucide-react'
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
  const [tab, setTab] = useState<'detalles' | 'proveedores' | 'conversaciones'>('detalles')

  // Track which listing_ids already have a booking (pre-filled + newly contacted)
  const [contactedIds, setContactedIds] = useState<Set<string>>(
    () => new Set(bookings.map((b: any) => b.provider_listings?.id).filter(Boolean))
  )
  const [allBookings, setAllBookings] = useState(bookings)

  // Modal
  const [pendingContact, setPendingContact] = useState<any | null>(null)
  const [contacting, setContacting] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const eventDate = new Date(event.event_date).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function confirmContact() {
    if (!pendingContact) return
    setContacting(true)
    const listing = pendingContact.provider_listings
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        event_id: event.id,
        event_date: event.event_date,
        event_type: event.event_type,
        event_zone: event.zone,
        event_title: event.title,
        estimated_guests: event.estimated_guests,
        budget_cents: event.budget_cents,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setContactedIds(prev => new Set([...prev, listing.id]))
      setAllBookings(prev => [...prev, {
        id: data.data.id,
        status: 'pending',
        provider_listings: listing,
        profiles: listing.profiles,
      }])
      setPendingContact(null)
      showToast('Solicitud enviada')
    }
    setContacting(false)
  }

  // Group saved listings by category
  const grouped = savedListings.reduce((acc: Record<string, any[]>, item: any) => {
    const cat: string = item.provider_listings?.category ?? 'otro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const tabs = [
    { key: 'detalles',       label: 'Detalles' },
    { key: 'proveedores',    label: `Proveedores${savedListings.length > 0 ? ` (${savedListings.length})` : ''}` },
    { key: 'conversaciones', label: `Conversaciones${allBookings.length > 0 ? ` (${allBookings.length})` : ''}` },
  ] as const

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm shadow-xl"
          style={{ background: '#16A34A', whiteSpace: 'nowrap' }}>
          <CheckCircle size={16} strokeWidth={2} />
          {toast}
        </div>
      )}

      {/* Confirmation modal */}
      {pendingContact && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4"
          style={{ background: 'rgba(28,15,10,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setPendingContact(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: '0 24px 48px rgba(28,15,10,0.2)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-extrabold text-lg" style={{ color: '#1C0F0A' }}>
                Contactar proveedor
              </h3>
              <button onClick={() => setPendingContact(null)} className="p-1 rounded-lg"
                style={{ color: '#8C7B75' }}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Provider */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#F9F3EE' }}>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#1C0F0A' }}>
                {pendingContact.provider_listings?.title}
              </p>
              <p className="text-xs mb-2" style={{ color: '#8C7B75' }}>
                {pendingContact.provider_listings?.profiles?.full_name}
              </p>
              <p className="font-bold text-sm" style={{ color: '#E8533A' }}>
                desde {formatARS(pendingContact.provider_listings?.base_price_cents)}
              </p>
            </div>

            {/* Event summary */}
            <div className="space-y-1.5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
                Para el evento
              </p>
              <p className="text-sm font-semibold" style={{ color: '#1C0F0A' }}>{event.title}</p>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8C7B75' }}>
                <Calendar size={12} strokeWidth={1.5} />
                {eventDate}
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8C7B75' }}>
                <MapPin size={12} strokeWidth={1.5} />
                {event.zone}
              </div>
            </div>

            <p className="text-xs mb-5 text-center" style={{ color: '#8C7B75' }}>
              El proveedor recibirá tu solicitud y deberá aceptarla para confirmar.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setPendingContact(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border"
                style={{ borderColor: '#E5E7EB', color: '#1C0F0A' }}>
                Cancelar
              </button>
              <button onClick={confirmContact} disabled={contacting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                style={{ background: '#E8533A' }}>
                {contacting ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed header with tabs */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 px-6 lg:px-10 pt-6 pb-0">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm mb-3 font-medium" style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          Mis Eventos
        </Link>
        <h1 className="text-xl font-extrabold mb-4" style={{ color: '#1C0F0A' }}>{event.title}</h1>

        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all"
              style={{
                background: tab === t.key ? '#FFF0ED' : 'transparent',
                color: tab === t.key ? '#E8533A' : '#8C7B75',
                borderBottom: tab === t.key ? '2px solid #E8533A' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 pb-28 lg:pb-8">

        {/* ── TAB: DETALLES ── */}
        {tab === 'detalles' && (
          <div className="max-w-2xl">
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

            <Link href={`/events/${event.id}/ai`}
              className="flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #E8533A 0%, #FF7A5C 100%)' }}>
              <Sparkles size={20} strokeWidth={1.5} className="text-white flex-shrink-0" />
              <div>
                <p className="font-semibold text-white text-sm">Planificador IA</p>
                <p className="text-xs text-white opacity-80">Encontrá los mejores proveedores para tu evento</p>
              </div>
            </Link>
          </div>
        )}

        {/* ── TAB: PROVEEDORES ── */}
        {tab === 'proveedores' && (
          <div>
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
                        {(items as any[]).length}
                      </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 lg:-mx-10 lg:px-10">
                      {(items as any[]).map((item: any) => (
                        <SavedProviderCard
                          key={item.id}
                          item={item}
                          eventId={event.id}
                          isContacted={contactedIds.has(item.provider_listings?.id)}
                          onContact={() => setPendingContact(item)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONVERSACIONES ── */}
        {tab === 'conversaciones' && (
          <div className="max-w-2xl">
            {allBookings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-semibold mb-1" style={{ color: '#1C0F0A' }}>Sin conversaciones aún</p>
                <p className="text-sm mb-4" style={{ color: '#8C7B75' }}>
                  Contactá un proveedor desde la tab "Proveedores" para iniciar una conversación.
                </p>
                <button onClick={() => setTab('proveedores')}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: '#E8533A' }}>
                  Ver proveedores
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {allBookings.map((b: any) => {
                  const status = STATUS_MAP[b.status] ?? STATUS_MAP.pending
                  return (
                    <Link key={b.id} href={`/bookings/${b.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                      style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                        style={{ background: '#E8533A' }}>
                        {b.profiles?.full_name?.[0] ?? b.provider_listings?.profiles?.full_name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm" style={{ color: '#1C0F0A' }}>
                          {b.profiles?.full_name ?? b.provider_listings?.profiles?.full_name}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#8C7B75' }}>
                          {b.provider_listings?.title}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: '#8C7B75' }}>
                          <MessageCircle size={10} strokeWidth={1.5} />
                          Ver chat
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function SavedProviderCard({
  item, eventId, isContacted, onContact,
}: {
  item: any
  eventId: string
  isContacted: boolean
  onContact: () => void
}) {
  const listing = item.provider_listings
  if (!listing) return null

  return (
    <div className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
      <Link href={`/events/${eventId}/providers/${listing.id}`} className="block group">
        <div className="h-28 bg-stone-100 overflow-hidden">
          {listing.portfolio_urls?.[0] ? (
            <img src={listing.portfolio_urls[0]} alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
        </div>
      </Link>

      <div className="px-3 pb-3">
        {isContacted ? (
          <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold"
            style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <CheckCircle size={11} strokeWidth={2} />
            Contactado
          </div>
        ) : (
          <button onClick={onContact}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: '#E8533A' }}>
            <MessageCircle size={11} strokeWidth={2} />
            Contactar
          </button>
        )}
      </div>
    </div>
  )
}
