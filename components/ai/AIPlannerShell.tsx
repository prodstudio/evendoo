"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Send, MapPin, ChevronLeft } from 'lucide-react'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS } from '@/types/provider'

type Message = { role: 'user' | 'assistant'; content: string; providers?: any[] }

type Props = { event: any; initialSession: any; userId: string }

export function AIPlannerShell({ event, initialSession, userId }: Props) {
  const [session, setSession] = useState(initialSession)
  const [messages, setMessages] = useState<Message[]>(
    session?.conversation ?? []
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)

  const eventDate = new Date(event.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  async function activate() {
    setActivating(true)
    const res = await fetch('/api/ai/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id }),
    })
    const data = await res.json()
    if (data.data?.session?.status === 'active') {
      setSession(data.data.session)
    } else if (data.data?.init_point) {
      window.location.href = data.data.init_point
    }
    setActivating(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || !session) return

    const userMsg: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          event,
          messages: updatedMessages,
          message: input,
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, providers: data.providers }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocurrió un error. Intentá de nuevo.' }])
    }
    setLoading(false)
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1 text-sm mb-8" style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} /> Volver al evento
        </Link>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #E8533A, #F4B942)' }}>
          <Sparkles size={28} strokeWidth={1.5} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#1C0F0A' }}>Asistente de planificación IA</h1>
        <p className="text-sm mb-2" style={{ color: '#8C7B75' }}>
          Te ayudo a encontrar los mejores proveedores para tu evento.
        </p>
        <p className="text-sm mb-8" style={{ color: '#8C7B75' }}>
          Evento: <strong>{event.title}</strong> · {eventDate} · {event.zone}
        </p>
        <div className="bg-white rounded-2xl p-5 mb-6 text-left" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#1C0F0A' }}>¿Qué incluye?</p>
          {['Curación inteligente de proveedores disponibles', 'Chat conversacional para ajustar preferencias', 'Contacto directo desde los resultados'].map(f => (
            <p key={f} className="text-sm flex items-center gap-2 py-1" style={{ color: '#8C7B75' }}>
              <span style={{ color: '#16A34A' }}>✓</span> {f}
            </p>
          ))}
        </div>
        <button
          onClick={activate}
          disabled={activating}
          className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #E8533A, #F4B942)' }}>
          {activating ? 'Activando...' : 'Activar asistente — $5 USD'}
        </button>
        <p className="text-xs mt-3" style={{ color: '#8C7B75' }}>Pago único por evento. Sin suscripción.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-screen" style={{ background: '#FDF8F3' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white">
        <Link href={`/events/${event.id}`} className="p-1.5 rounded-xl hover:bg-stone-50">
          <ChevronLeft size={18} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
        </Link>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #E8533A, #F4B942)' }}>
          <Sparkles size={14} strokeWidth={1.5} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>Asistente IA</p>
          <p className="text-xs" style={{ color: '#8C7B75' }}>{event.title} · {eventDate}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>¡Hola! Soy tu asistente de planificación.</p>
            <p className="text-sm" style={{ color: '#8C7B75' }}>Contame qué tipo de proveedores necesitás para tu evento y te hago una curación personalizada.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm"
                style={{
                  background: msg.role === 'user' ? '#FFF0ED' : 'white',
                  color: '#1C0F0A',
                  boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(28,15,10,0.06)' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                }}>
                {msg.content}
              </div>
            </div>

            {/* Provider cards from AI */}
            {msg.providers && msg.providers.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.providers.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ boxShadow: '0 2px 12px rgba(28,15,10,0.06)' }}>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#1C0F0A' }}>{p.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
                        <span className="text-xs truncate" style={{ color: '#8C7B75' }}>{p.zone}</span>
                        <span className="text-xs" style={{ color: '#C4AFA9' }}>·</span>
                        <span className="text-xs" style={{ color: '#8C7B75' }}>
                          {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mt-1" style={{ color: '#E8533A' }}>
                        desde {formatARS(p.base_price_cents)}
                      </p>
                    </div>
                    <Link
                      href={`/bookings/new?listing=${p.id}`}
                      className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-white text-xs"
                      style={{ background: '#E8533A' }}>
                      Contactar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white" style={{ boxShadow: '0 2px 8px rgba(28,15,10,0.06)' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#E8533A', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-stone-100 bg-white">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Necesito un fotógrafo y DJ para 100 personas..."
          className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 outline-none focus:border-orange-300 text-sm"
          style={{ background: '#FDF8F3' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-full text-white disabled:opacity-40"
          style={{ background: '#E8533A' }}>
          <Send size={16} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )
}
