"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, Calendar, MapPin, User } from 'lucide-react'

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<'accept' | 'decline' | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookings')
      .select(`
        *,
        provider_listings(title, category, base_price_cents),
        host:profiles!bookings_host_id_fkey(full_name, avatar_url)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setBooking(data)
        setLoading(false)
      })
  }, [id])

  async function handleAction(action: 'accept' | 'decline') {
    setActing(action)
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      router.push('/proposals')
      router.refresh()
    } else {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-100 rounded-xl w-3/4" />
          <div className="h-40 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p style={{ color: '#8C7B75' }}>Propuesta no encontrada</p>
        <Link href="/proposals" className="text-sm font-medium mt-4 inline-block" style={{ color: '#E8533A' }}>
          Volver a propuestas
        </Link>
      </div>
    )
  }

  const host = booking.host
  const listing = booking.provider_listings
  const eventDate = new Date(booking.event_date).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const isPending = booking.status === 'pending'
  const isAccepted = booking.status === 'accepted'

  return (
    <div className="px-6 lg:px-10 py-6 pb-28 lg:pb-8 overflow-y-auto h-full">
      <Link href="/proposals" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: '#8C7B75' }}>
        <ChevronLeft size={16} strokeWidth={1.5} />
        Propuestas
      </Link>

      {/* Status banner */}
      {isAccepted && (
        <div className="rounded-2xl px-4 py-3 mb-4 text-sm font-medium"
          style={{ background: '#F0FDF4', color: '#16A34A' }}>
          ✅ Propuesta aceptada — el host puede pagar la seña
        </div>
      )}

      {/* Host info */}
      <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: '#E8533A' }}>
            {host?.full_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-bold" style={{ color: '#1C0F0A' }}>{host?.full_name ?? 'Host'}</p>
            <p className="text-sm" style={{ color: '#8C7B75' }}>Organizador del evento</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            {eventDate}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <MapPin size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            {booking.event_zone} · {booking.event_type}
          </div>
          {listing && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
              <User size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
              Servicio: {listing.title}
            </div>
          )}
        </div>

        {listing?.base_price_cents && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-sm" style={{ color: '#8C7B75' }}>Tu precio acordado</span>
            <span className="font-bold text-lg" style={{ color: '#E8533A' }}>
              ${(listing.base_price_cents / 100).toLocaleString('es-AR')}
            </span>
          </div>
        )}

        {booking.description && (
          <p className="text-sm mt-4 pt-4 border-t border-stone-100" style={{ color: '#8C7B75' }}>
            "{booking.description}"
          </p>
        )}
      </div>

      {/* Payment breakdown (when accepted) */}
      {isAccepted && listing?.base_price_cents && (
        <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <h2 className="font-semibold mb-3" style={{ color: '#1C0F0A' }}>Desglose de pagos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#8C7B75' }}>Seña (30%)</span>
              <span style={{ color: '#1C0F0A' }}>
                ${Math.round(listing.base_price_cents * 0.3 / 100).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#8C7B75' }}>Saldo (70%)</span>
              <span style={{ color: '#1C0F0A' }}>
                ${Math.round(listing.base_price_cents * 0.7 / 100).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-stone-100">
              <span>Total</span>
              <span style={{ color: '#E8533A' }}>
                ${(listing.base_price_cents / 100).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleAction('accept')}
            disabled={!!acting}
            className="py-3.5 rounded-2xl font-semibold text-white disabled:opacity-60"
            style={{ background: '#16A34A' }}>
            {acting === 'accept' ? 'Aceptando...' : 'Aceptar propuesta'}
          </button>
          <button
            onClick={() => handleAction('decline')}
            disabled={!!acting}
            className="py-3.5 rounded-2xl font-semibold border disabled:opacity-60"
            style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}>
            {acting === 'decline' ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      )}

      {isAccepted && (
        <Link
          href={`/bookings/${id}/chat`}
          className="flex items-center justify-center py-3.5 rounded-2xl font-semibold text-white"
          style={{ background: '#E8533A' }}>
          Abrir chat con el host
        </Link>
      )}
    </div>
  )
}
