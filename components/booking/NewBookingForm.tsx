"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Tag, FileText } from 'lucide-react'

const EVENT_TYPES = [
  'Cumpleaños', 'Casamiento', 'XV años', 'Bautismo',
  'Comunión', 'Corporativo', 'Graduación', 'Social', 'Otro',
]

type Props = {
  listingId: string
  listingTitle: string
  providerZone: string
}

export function NewBookingForm({ listingId, listingTitle, providerZone }: Props) {
  const router = useRouter()
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventZone, setEventZone] = useState(providerZone)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDate || !eventType || !eventZone.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        event_date: eventDate,
        event_type: eventType,
        event_zone: eventZone.trim(),
        description: description.trim() || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error?.message ?? 'No se pudo enviar la propuesta')
      setLoading(false)
      return
    }

    router.push(`/bookings/${data.data.id}`)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event date */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
          <Calendar size={13} strokeWidth={1.5} />
          Fecha del evento
        </label>
        <input
          type="date"
          required
          min={minDateStr}
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          className={inputClass}
          style={{ color: '#1C0F0A' }}
        />
      </div>

      {/* Event type */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
          <Tag size={13} strokeWidth={1.5} />
          Tipo de evento
        </label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setEventType(type)}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{
                borderColor: eventType === type ? '#E8533A' : '#E5E7EB',
                background: eventType === type ? '#FFF0ED' : 'white',
                color: eventType === type ? '#E8533A' : '#1C0F0A',
              }}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Zone */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
          <MapPin size={13} strokeWidth={1.5} />
          Zona del evento
        </label>
        <input
          type="text"
          required
          placeholder="Ej: Palermo, CABA"
          value={eventZone}
          onChange={e => setEventZone(e.target.value)}
          className={inputClass}
          style={{ color: '#1C0F0A' }}
        />
      </div>

      {/* Description */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
          <FileText size={13} strokeWidth={1.5} />
          Detalles adicionales <span className="font-normal normal-case">(opcional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Contale al proveedor sobre tu evento, cantidad de invitados, horarios, expectativas..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={`${inputClass} resize-none`}
          style={{ color: '#1C0F0A' }}
        />
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', color: '#DC2626' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !eventDate || !eventType || !eventZone.trim()}
        className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40 transition-opacity"
        style={{ background: '#E8533A' }}>
        {loading ? 'Enviando propuesta...' : `Enviar propuesta a ${listingTitle}`}
      </button>

      <p className="text-xs text-center" style={{ color: '#8C7B75' }}>
        El proveedor recibirá tu solicitud y deberá aceptarla para confirmar la reserva.
      </p>
    </form>
  )
}
