"use client"

import Link from 'next/link'
import { MapPin, Plus, Check } from 'lucide-react'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'
import { useState } from 'react'

type Props = {
  listing: any
  eventId: string
  initialSaved: boolean
}

export function ProviderCardForEvent({ listing, eventId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading || saved) return
    setLoading(true)
    const res = await fetch('/api/event-saved-listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, listing_id: listing.id }),
    })
    if (res.ok) setSaved(true)
    setLoading(false)
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white relative"
      style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
      <Link href={`/events/${eventId}/providers/${listing.id}`} className="block group">
        <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
          {listing.portfolio_urls?.[0] ? (
            <img src={listing.portfolio_urls[0]} alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
          )}
          <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ background: 'rgba(232,83,58,0.9)', backdropFilter: 'blur(4px)' }}>
            {CATEGORY_LABELS[listing.category as ProviderCategory]}
          </span>
        </div>
        <div className="p-4 pb-3">
          <h3 className="font-semibold truncate text-sm" style={{ color: '#1C0F0A' }}>{listing.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={11} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
            <span className="text-xs truncate" style={{ color: '#8C7B75' }}>{listing.zone}</span>
          </div>
          <p className="font-bold mt-1.5 text-sm" style={{ color: '#E8533A' }}>
            desde {formatARS(listing.base_price_cents)}
          </p>
        </div>
      </Link>

      {/* Add button outside the Link */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          disabled={loading || saved}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: saved ? '#F0FDF4' : '#FFF0ED',
            color: saved ? '#16A34A' : '#E8533A',
            border: saved ? '1.5px solid #86EFAC' : '1.5px solid #FECACA',
          }}>
          {saved
            ? <><Check size={12} strokeWidth={2.5} /> Agregado</>
            : <><Plus size={12} strokeWidth={2.5} /> Agregar al evento</>
          }
        </button>
      </div>
    </div>
  )
}
