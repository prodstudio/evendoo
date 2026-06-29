"use client"

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'

type Props = {
  eventId: string
  listingId: string
  initialSaved: boolean
}

export function AddToEventButton({ eventId, listingId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    const method = saved ? 'DELETE' : 'POST'
    const res = await fetch('/api/event-saved-listings', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, listing_id: listingId }),
    })
    if (res.ok) setSaved(s => !s)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      style={{
        background: saved ? '#F0FDF4' : '#E8533A',
        color: saved ? '#16A34A' : 'white',
        border: saved ? '2px solid #86EFAC' : 'none',
      }}>
      {saved ? (
        <><Check size={18} strokeWidth={2.5} /> Agregado al evento</>
      ) : (
        <><Plus size={18} strokeWidth={2.5} /> Agregar al evento</>
      )}
    </button>
  )
}
