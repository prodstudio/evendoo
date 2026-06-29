"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Plus, Calendar, MapPin, Tag, Users, ChevronRight } from 'lucide-react'

type Event = {
  id: string
  title: string
  event_type: string
  event_date: string
  zone: string
  estimated_guests: number | null
  budget_cents: number | null
  notes: string | null
}

type Props = {
  listingId: string
  listingTitle: string
  providerZone: string
  existingEvents: Event[]
}

const EVENT_TYPES = [
  'Cumpleaños', 'Casamiento', 'XV años', 'Bautismo',
  'Comunión', 'Corporativo', 'Graduación', 'Social', 'Otro',
]

export function BookingWithEventForm({ listingId, listingTitle, providerZone, existingEvents }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'pick' | 'quick' | 'confirm'>('pick')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Quick event form state
  const [qType, setQType] = useState('')
  const [qDate, setQDate] = useState('')
  const [qZone, setQZone] = useState(providerZone)
  const [qTitle, setQTitle] = useState('')

  // Confirm step state
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white"

  function selectExistingEvent(ev: Event) {
    setSelectedEvent(ev)
    setStep('confirm')
  }

  function applyQuickEvent() {
    if (!qType || !qDate || !qZone.trim()) return
    const title = qTitle.trim() || `${qType} ${new Date(qDate).getFullYear()}`
    setSelectedEvent({
      id: '', // will create inline
      title,
      event_type: qType,
      event_date: qDate,
      zone: qZone.trim(),
      estimated_guests: null,
      budget_cents: null,
      notes: null,
    })
    setStep('confirm')
  }

  async function handleSubmit() {
    if (!selectedEvent) return
    setLoading(true)
    setError('')

    let eventId = selectedEvent.id || null

    // If quick event (no id), create it first
    if (!eventId) {
      const evRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedEvent.title,
          event_type: selectedEvent.event_type,
          event_date: selectedEvent.event_date,
          zone: selectedEvent.zone,
        }),
      })
      const evData = await evRes.json()
      if (!evRes.ok) {
        setError(evData.error ?? 'Error al crear el evento')
        setLoading(false)
        return
      }
      eventId = evData.data.id
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        event_id: eventId,
        event_date: selectedEvent.event_date,
        event_type: selectedEvent.event_type,
        event_zone: selectedEvent.zone,
        description: description.trim() || null,
        // pass for initial message
        event_title: selectedEvent.title,
        estimated_guests: selectedEvent.estimated_guests,
        budget_cents: selectedEvent.budget_cents,
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

  // ── STEP: pick event ────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold" style={{ color: '#1C0F0A' }}>¿Para qué evento?</p>

        {/* Existing events */}
        {existingEvents.length > 0 && (
          <div className="space-y-2">
            {existingEvents.map(ev => (
              <button key={ev.id} onClick={() => selectExistingEvent(ev)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white text-left transition-all hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFF0ED' }}>
                  <CalendarDays size={18} strokeWidth={1.5} style={{ color: '#E8533A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#1C0F0A' }}>{ev.title}</p>
                  <p className="text-xs truncate" style={{ color: '#8C7B75' }}>
                    {ev.event_type} · {new Date(ev.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={16} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
              </button>
            ))}
          </div>
        )}

        {/* Quick create */}
        <button onClick={() => setStep('quick')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all hover:border-orange-300"
          style={{ borderColor: '#E5E7EB', background: 'white' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#F9F3EE' }}>
            <Plus size={18} strokeWidth={2} style={{ color: '#E8533A' }} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>Crear nuevo evento</p>
            <p className="text-xs" style={{ color: '#8C7B75' }}>
              {existingEvents.length === 0 ? 'Completá los datos básicos de tu evento' : 'Para un evento distinto'}
            </p>
          </div>
        </button>
      </div>
    )
  }

  // ── STEP: quick event form ──────────────────────────────────────────
  if (step === 'quick') {
    return (
      <div className="space-y-5">
        <button onClick={() => setStep('pick')} className="text-sm" style={{ color: '#8C7B75' }}>
          ← Volver
        </button>

        <p className="text-sm font-semibold" style={{ color: '#1C0F0A' }}>Datos del evento</p>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#8C7B75' }}>Nombre del evento</label>
          <input type="text" placeholder={`Ej: Mi cumpleaños ${new Date().getFullYear() + 1}`}
            value={qTitle} onChange={e => setQTitle(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
            <Tag size={13} strokeWidth={1.5} /> Tipo
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => (
              <button key={type} type="button" onClick={() => setQType(type)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium border transition-all"
                style={{
                  borderColor: qType === type ? '#E8533A' : '#E5E7EB',
                  background: qType === type ? '#FFF0ED' : 'white',
                  color: qType === type ? '#E8533A' : '#1C0F0A',
                }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
            <Calendar size={13} strokeWidth={1.5} /> Fecha
          </label>
          <input type="date" min={minDateStr} value={qDate} onChange={e => setQDate(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7B75' }}>
            <MapPin size={13} strokeWidth={1.5} /> Zona
          </label>
          <input type="text" placeholder="Ej: Palermo, CABA" value={qZone}
            onChange={e => setQZone(e.target.value)}
            className={inputClass} style={{ color: '#1C0F0A' }} />
        </div>

        <button onClick={applyQuickEvent}
          disabled={!qType || !qDate || !qZone.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40"
          style={{ background: '#E8533A' }}>
          Continuar
        </button>
      </div>
    )
  }

  // ── STEP: confirm ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button onClick={() => setStep('pick')} className="text-sm" style={{ color: '#8C7B75' }}>
        ← Cambiar evento
      </button>

      {/* Selected event summary */}
      <div className="rounded-2xl p-4" style={{ background: '#F9F3EE' }}>
        <p className="font-semibold text-sm mb-2" style={{ color: '#1C0F0A' }}>{selectedEvent!.title}</p>
        <div className="space-y-1 text-xs" style={{ color: '#8C7B75' }}>
          <p>🗓 {new Date(selectedEvent!.event_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p>🎉 {selectedEvent!.event_type}</p>
          <p>📍 {selectedEvent!.zone}</p>
          {selectedEvent!.estimated_guests && <p>👥 {selectedEvent!.estimated_guests} invitados</p>}
        </div>
      </div>

      {/* Optional description */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#8C7B75' }}>
          Mensaje para el proveedor <span className="font-normal normal-case">(opcional)</span>
        </label>
        <textarea rows={3}
          placeholder="Contale más detalles, horarios, expectativas..."
          value={description} onChange={e => setDescription(e.target.value)}
          className={`${inputClass} resize-none`} style={{ color: '#1C0F0A' }} />
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</p>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-60"
        style={{ background: '#E8533A' }}>
        {loading ? 'Enviando propuesta...' : `Contactar a ${listingTitle}`}
      </button>

      <p className="text-xs text-center" style={{ color: '#8C7B75' }}>
        El proveedor recibirá tu solicitud y deberá aceptarla para confirmar.
      </p>
    </div>
  )
}
