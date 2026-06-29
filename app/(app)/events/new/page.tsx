"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, MapPin, Tag, Users, DollarSign } from 'lucide-react'

const EVENT_TYPES = [
  'Cumpleaños', 'Casamiento', 'XV años', 'Bautismo',
  'Comunión', 'Corporativo', 'Graduación', 'Social', 'Otro',
]

export default function NewEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [zone, setZone] = useState('')
  const [guests, setGuests] = useState('')
  const [budget, setBudget] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventType || !eventDate || !zone.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate,
        zone: zone.trim(),
        estimated_guests: guests ? parseInt(guests) : null,
        budget_cents: budget ? Math.round(parseFloat(budget.replace(/\./g, '')) * 100) : null,
        notes: notes.trim() || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear el evento')
      setLoading(false)
      return
    }

    router.push(`/events/${data.data.id}`)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white"
  const labelClass = "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2"

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 lg:pb-8 overflow-y-auto h-full">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: '#8C7B75' }}>
        <ChevronLeft size={16} strokeWidth={1.5} />
        Mis Eventos
      </Link>

      <h1 className="text-2xl font-extrabold mb-6" style={{ color: '#1C0F0A' }}>Nuevo evento</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className={labelClass} style={{ color: '#8C7B75' }}>Nombre del evento</label>
          <input type="text" required placeholder="Ej: Mi cumpleaños 2026, Casamiento de Ana y Juan"
            value={title} onChange={e => setTitle(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <div>
          <label className={labelClass} style={{ color: '#8C7B75' }}>
            <Tag size={13} strokeWidth={1.5} />
            Tipo de evento
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => (
              <button key={type} type="button" onClick={() => setEventType(type)}
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

        <div>
          <label className={labelClass} style={{ color: '#8C7B75' }}>
            <Calendar size={13} strokeWidth={1.5} />
            Fecha del evento
          </label>
          <input type="date" required min={minDateStr} value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <div>
          <label className={labelClass} style={{ color: '#8C7B75' }}>
            <MapPin size={13} strokeWidth={1.5} />
            Zona / Ubicación
          </label>
          <input type="text" required placeholder="Ej: Palermo, CABA"
            value={zone} onChange={e => setZone(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={{ color: '#8C7B75' }}>
              <Users size={13} strokeWidth={1.5} />
              Invitados
            </label>
            <input type="number" min="1" placeholder="100"
              value={guests} onChange={e => setGuests(e.target.value)}
              className={inputClass} style={{ color: '#1C0F0A' }} />
          </div>
          <div>
            <label className={labelClass} style={{ color: '#8C7B75' }}>
              <DollarSign size={13} strokeWidth={1.5} />
              Presupuesto ($)
            </label>
            <input type="text" placeholder="500000"
              value={budget} onChange={e => setBudget(e.target.value)}
              className={inputClass} style={{ color: '#1C0F0A' }} />
          </div>
        </div>

        <div>
          <label className={labelClass} style={{ color: '#8C7B75' }}>
            Notas <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea rows={3} placeholder="Tema de la fiesta, requerimientos especiales..."
            value={notes} onChange={e => setNotes(e.target.value)}
            className={`${inputClass} resize-none`} style={{ color: '#1C0F0A' }} />
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</p>
        )}

        <button type="submit"
          disabled={loading || !title.trim() || !eventType || !eventDate || !zone.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40"
          style={{ background: '#E8533A' }}>
          {loading ? 'Creando evento...' : 'Crear evento'}
        </button>
      </form>
    </div>
  )
}
