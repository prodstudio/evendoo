"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/booking'
import { Send, MessageCircle } from 'lucide-react'

type Booking = {
  id: string
  status: string
  provider_listings: { title: string; portfolio_urls: string[] } | null
  provider: { full_name: string } | null
  messages: { body: string; created_at: string; sender_id: string }[]
}

type Props = {
  bookings: Booking[]
  currentUserId: string
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FFF9E6', color: '#D97706', label: 'Esperando respuesta' },
  accepted:  { bg: '#F0FDF4', color: '#16A34A', label: 'Activo' },
  declined:  { bg: '#FEF2F2', color: '#DC2626', label: 'Declinado' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelado' },
}

export function ConversationsLayout({ bookings, currentUserId }: Props) {
  const [activeId, setActiveId] = useState<string | null>(bookings[0]?.id ?? null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeBooking = bookings.find(b => b.id === activeId)

  // Load messages for all bookings initially
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .in('booking_id', bookings.map(b => b.id))
        .order('created_at', { ascending: true })
      if (data) {
        const grouped: Record<string, Message[]> = {}
        for (const m of data) {
          if (!grouped[m.booking_id]) grouped[m.booking_id] = []
          grouped[m.booking_id].push(m as Message)
        }
        setMessages(grouped)
      }
    }
    if (bookings.length > 0) load()
  }, [])

  // Realtime for active chat
  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`booking:${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `booking_id=eq.${activeId}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => ({
          ...prev,
          [activeId]: [...(prev[activeId] ?? []), msg],
        }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !activeId || sending) return
    setSending(true)
    const optimistic: Message = {
      id: crypto.randomUUID(), booking_id: activeId, sender_id: currentUserId,
      body: text, attachment_url: null, attachment_type: null, created_at: new Date().toISOString(),
    }
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), optimistic] }))
    setText('')
    await supabase.from('messages').insert({ booking_id: activeId, sender_id: currentUserId, body: optimistic.body })
    setSending(false)
  }

  const activeMessages = activeId ? (messages[activeId] ?? []) : []

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#FDF8F3' }}>

      {/* LEFT — conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-stone-100 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-stone-100">
          <h1 className="text-lg font-extrabold" style={{ color: '#1C0F0A' }}>Conversaciones</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {bookings.map(b => {
            const msgs = messages[b.id] ?? b.messages ?? []
            const last = msgs[msgs.length - 1]
            const photo = b.provider_listings?.portfolio_urls?.[0]
            const name = b.provider?.full_name || 'Proveedor'
            const sc = STATUS_COLOR[b.status] ?? STATUS_COLOR.pending
            const isActive = b.id === activeId

            return (
              <button key={b.id} onClick={() => setActiveId(b.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-stone-50 transition-colors"
                style={{ background: isActive ? '#FFF0ED' : 'transparent' }}>
                {/* Photo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: '#E8533A' }}>
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1C0F0A' }}>{name}</p>
                    {last && (
                      <span className="text-xs flex-shrink-0" style={{ color: '#8C7B75' }}>
                        {new Date(last.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#8C7B75' }}>
                    {b.provider_listings?.title}
                  </p>
                  {last && (
                    <p className="text-xs truncate mt-0.5" style={{ color: isActive ? '#E8533A' : '#8C7B75' }}>
                      {last.body}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT — chat panel */}
      {activeBooking ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-stone-100 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
              style={{ background: '#E8533A' }}>
              {activeBooking.provider_listings?.portfolio_urls?.[0]
                ? <img src={activeBooking.provider_listings.portfolio_urls[0]} alt="" className="w-full h-full object-cover" />
                : activeBooking.provider?.full_name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>
                {activeBooking.provider?.full_name || 'Proveedor'}
              </p>
              <p className="text-xs" style={{ color: '#8C7B75' }}>{activeBooking.provider_listings?.title}</p>
            </div>
            <div className="ml-auto">
              {(() => {
                const sc = STATUS_COLOR[activeBooking.status] ?? STATUS_COLOR.pending
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" style={{ background: '#FDF8F3' }}>
            {activeMessages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#8C7B75' }}>No hay mensajes todavía</p>
              </div>
            )}
            {activeMessages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[65%] px-4 py-2 rounded-2xl text-sm"
                    style={{
                      background: isMe ? '#E8533A' : 'white',
                      color: isMe ? 'white' : '#1C0F0A',
                      boxShadow: isMe ? 'none' : '0 1px 8px rgba(28,15,10,0.06)',
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius: !isMe ? 4 : undefined,
                    }}>
                    {msg.body}
                    <div className="text-xs mt-1 opacity-60 text-right">
                      {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage}
            className="flex items-center gap-3 px-5 py-3 bg-white border-t border-stone-100 flex-shrink-0">
            <input
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none border border-stone-200 focus:border-orange-300 transition-colors"
              style={{ background: '#FDF8F3', color: '#1C0F0A' }}
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: '#E8533A' }}>
              <Send size={16} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle size={40} strokeWidth={1} style={{ color: '#D4B5A8', margin: '0 auto 12px' }} />
            <p style={{ color: '#8C7B75' }}>Seleccioná una conversación</p>
          </div>
        </div>
      )}
    </div>
  )
}
