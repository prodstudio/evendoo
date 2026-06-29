"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Users, DollarSign } from 'lucide-react'

const EVENT_TYPES = [
  { label: 'Cumpleaños', emoji: '🎂' },
  { label: 'Casamiento', emoji: '💍' },
  { label: 'XV años', emoji: '👑' },
  { label: 'Bautismo', emoji: '✝️' },
  { label: 'Comunión', emoji: '🕊️' },
  { label: 'Corporativo', emoji: '💼' },
  { label: 'Graduación', emoji: '🎓' },
  { label: 'Social', emoji: '🎉' },
  { label: 'Otro', emoji: '✨' },
]

type StepId = 'name' | 'type' | 'date' | 'zone' | 'details' | 'summary'

const STEPS: StepId[] = ['name', 'type', 'date', 'zone', 'details', 'summary']

const STEP_META: Record<StepId, { question: string; hint?: string }> = {
  name:    { question: '¿Cómo se llama tu evento?', hint: 'Ej: Mi cumpleaños 2026, Casamiento de Ana y Juan' },
  type:    { question: '¿Qué tipo de evento es?' },
  date:    { question: '¿Cuándo es tu evento?' },
  zone:    { question: '¿Dónde se realiza?', hint: 'Ej: Palermo, CABA · San Isidro, GBA' },
  details: { question: 'Detalles adicionales', hint: 'Opcional — cuantos invitados, presupuesto y notas' },
  summary: { question: 'Resumen del evento' },
}

export default function NewEventPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const [name, setName]     = useState('')
  const [type, setType]     = useState('')
  const [date, setDate]     = useState('')
  const [zone, setZone]     = useState('')
  const [guests, setGuests] = useState('')
  const [budget, setBudget] = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const canAdvance = {
    name:    name.trim().length > 0,
    type:    type.length > 0,
    date:    date.length > 0,
    zone:    zone.trim().length > 0,
    details: true,
    summary: true,
  }[step]

  function next() { if (canAdvance) setStepIndex(i => i + 1) }
  function back() { setStepIndex(i => Math.max(0, i - 1)) }

  async function handleCreate() {
    setLoading(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: name.trim(),
        event_type: type,
        event_date: date,
        zone: zone.trim(),
        estimated_guests: guests ? parseInt(guests) : null,
        budget_cents: budget ? Math.round(parseFloat(budget.replace(/\./g, '')) * 100) : null,
        notes: notes.trim() || null,
      }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/events/${data.data.id}`)
    else setLoading(false)
  }

  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  const inputClass = "w-full max-w-md mx-auto px-5 py-4 rounded-2xl border border-stone-200 text-lg outline-none focus:border-orange-400 bg-white text-center"

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#FDF8F3' }}>

      {/* Top bar: back + progress */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          {stepIndex > 0 ? (
            <button onClick={back} className="flex items-center gap-1 text-sm font-medium" style={{ color: '#8C7B75' }}>
              <ChevronLeft size={16} strokeWidth={2} />
              Atrás
            </button>
          ) : (
            <Link href="/events" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#8C7B75' }}>
              <ChevronLeft size={16} strokeWidth={2} />
              Mis Eventos
            </Link>
          )}
          <span className="text-xs font-semibold" style={{ color: '#8C7B75' }}>
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F0E6DF' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#E8533A' }}
          />
        </div>
      </div>

      {/* Step content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="w-full max-w-xl text-center">

          {/* Question */}
          <h2 className="text-2xl lg:text-3xl font-extrabold mb-2" style={{ color: '#1C0F0A' }}>
            {STEP_META[step].question}
          </h2>
          {STEP_META[step].hint && step !== 'summary' && (
            <p className="text-sm mb-8" style={{ color: '#8C7B75' }}>{STEP_META[step].hint}</p>
          )}

          {/* ── Step: name ── */}
          {step === 'name' && (
            <input
              autoFocus
              type="text"
              placeholder="Mi cumpleaños 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
              className={inputClass}
              style={{ color: '#1C0F0A' }}
            />
          )}

          {/* ── Step: type ── */}
          {step === 'type' && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {EVENT_TYPES.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => { setType(label); setTimeout(next, 150) }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm border-2 transition-all"
                  style={{
                    borderColor: type === label ? '#E8533A' : '#E5E7EB',
                    background:  type === label ? '#FFF0ED' : 'white',
                    color:       type === label ? '#E8533A' : '#1C0F0A',
                    transform:   type === label ? 'scale(1.04)' : 'scale(1)',
                  }}>
                  <span className="text-xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Step: date ── */}
          {step === 'date' && (
            <div className="flex justify-center mt-6">
              <input
                autoFocus
                type="date"
                min={minDateStr}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-5 py-4 rounded-2xl border border-stone-200 text-lg outline-none focus:border-orange-400 bg-white"
                style={{ color: '#1C0F0A', minWidth: 220 }}
              />
            </div>
          )}

          {/* ── Step: zone ── */}
          {step === 'zone' && (
            <input
              autoFocus
              type="text"
              placeholder="Palermo, CABA"
              value={zone}
              onChange={e => setZone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
              className={inputClass}
              style={{ color: '#1C0F0A' }}
            />
          )}

          {/* ── Step: details ── */}
          {step === 'details' && (
            <div className="w-full max-w-md mx-auto space-y-4 text-left mt-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7B75' }}>
                  <Users size={12} strokeWidth={1.5} /> Invitados estimados
                </label>
                <input type="number" min="1" placeholder="100"
                  value={guests} onChange={e => setGuests(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white"
                  style={{ color: '#1C0F0A' }} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7B75' }}>
                  <DollarSign size={12} strokeWidth={1.5} /> Presupuesto total ($)
                </label>
                <input type="text" placeholder="500000"
                  value={budget} onChange={e => setBudget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white"
                  style={{ color: '#1C0F0A' }} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#8C7B75' }}>
                  Notas
                </label>
                <textarea rows={3} placeholder="Tema, requerimientos especiales..."
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-300 bg-white resize-none"
                  style={{ color: '#1C0F0A' }} />
              </div>
            </div>
          )}

          {/* ── Step: summary ── */}
          {step === 'summary' && (
            <div className="w-full max-w-md mx-auto mt-4 text-left space-y-1">
              <SummaryRow icon="✏️" label="Nombre" value={name} />
              <SummaryRow icon="🎉" label="Tipo" value={type} />
              <SummaryRow icon="🗓" label="Fecha" value={new Date(date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
              <SummaryRow icon="📍" label="Zona" value={zone} />
              {guests && <SummaryRow icon="👥" label="Invitados" value={`${guests} personas`} />}
              {budget && <SummaryRow icon="💰" label="Presupuesto" value={`$${parseInt(budget).toLocaleString('es-AR')}`} />}
              {notes  && <SummaryRow icon="📝" label="Notas" value={notes} />}
            </div>
          )}

        </div>
      </div>

      {/* Bottom action */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <div className="max-w-md mx-auto">
          {step === 'summary' ? (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-60 transition-opacity"
              style={{ background: '#E8533A' }}>
              {loading ? 'Creando evento...' : '✓ Crear evento'}
            </button>
          ) : (
            step !== 'type' && (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40 transition-opacity"
                style={{ background: '#E8533A' }}>
                Continuar
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )
          )}
        </div>
      </div>

    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <span className="text-lg w-6 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8C7B75' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: '#1C0F0A' }}>{value}</p>
      </div>
    </div>
  )
}
