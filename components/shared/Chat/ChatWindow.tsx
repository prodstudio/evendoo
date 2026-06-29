"use client"

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/booking'
import type { Payment } from '@/types/payment'
import { Send, Paperclip, FileText, ExternalLink } from 'lucide-react'
import { PaymentButton } from './PaymentButton'
import { PaymentStatusBadge } from '../PaymentStatus/PaymentStatusBadge'
import { formatARS } from '@/lib/payments/format'

type Props = {
  booking: any
  initialMessages: Message[]
  currentUserId: string
  payment: Payment | null
  userRole: 'host' | 'provider'
}

export function ChatWindow({ booking, initialMessages, currentUserId, payment, userRole }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`booking:${booking.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${booking.id}`,
      }, payload => {
        const msg = payload.new as Message
        if (msg.sender_id !== currentUserId) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [booking.id, currentUserId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const optimistic: Message = {
      id: crypto.randomUUID(), booking_id: booking.id, sender_id: currentUserId,
      body: text, attachment_url: null, attachment_type: null, created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    await supabase.from('messages').insert({ booking_id: booking.id, sender_id: currentUserId, body: text })
    setSending(false)
  }

  const otherName = userRole === 'host'
    ? booking.profiles?.full_name
    : booking.host_profiles?.full_name || 'Host'

  return (
    <div className="flex flex-col h-screen max-h-screen" style={{ background: '#FDF8F3' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white sticky top-0 z-10">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: '#E8533A' }}>
          {otherName?.[0] || '?'}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>{otherName}</p>
          <p className="text-xs" style={{ color: '#8C7B75' }}>{booking.provider_listings?.title}</p>
        </div>
        {payment && (
          <div className="ml-auto">
            <PaymentStatusBadge status={payment.status} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {booking.status === 'pending' && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: '#FFF0ED' }}>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="font-medium" style={{ color: '#1C0F0A' }}>Esperando respuesta de {otherName}</p>
            <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>Los proveedores suelen responder en menos de 2 horas</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {msg.attachment_type === 'pdf' && msg.attachment_url ? (
                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[75%] hover:opacity-90 transition-opacity"
                  style={{ background: '#FFF0ED', border: '1px solid #F0D0C8' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#E8533A' }}>
                    <FileText size={16} strokeWidth={1.5} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1C0F0A' }}>{msg.body}</p>
                    <p className="text-xs" style={{ color: '#8C7B75' }}>Tocar para ver</p>
                  </div>
                  <ExternalLink size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
                </a>
              ) : (
                <div
                  className="max-w-[75%] px-4 py-2 rounded-2xl text-sm"
                  style={{
                    background: isMe ? '#FFF0ED' : '#F5EDE6',
                    color: '#1C0F0A',
                    borderBottomRightRadius: isMe ? 4 : undefined,
                    borderBottomLeftRadius: !isMe ? 4 : undefined,
                  }}
                >
                  {msg.body}
                </div>
              )}
            </div>
          )
        })}

        {/* Payment button in chat */}
        {payment && userRole === 'host' && (
          <div className="flex justify-center py-2">
            <PaymentButton payment={payment} bookingId={booking.id} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {booking.status === 'accepted' && (
        <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-stone-100 bg-white">
          {userRole === 'provider' && (
            <button
              type="button"
              title="Enviar factura"
              onClick={async () => {
                const invoiceUrl = `/api/invoice/${booking.id}`
                await supabase.from('messages').insert({
                  booking_id: booking.id,
                  sender_id: currentUserId,
                  body: 'Factura del servicio',
                  attachment_url: invoiceUrl,
                  attachment_type: 'pdf',
                })
              }}
              className="p-2 rounded-full" style={{ color: '#8C7B75' }}>
              <Paperclip size={18} strokeWidth={1.5} />
            </button>
          )}
          <input
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 outline-none focus:border-orange-300 text-sm"
            style={{ background: '#FDF8F3' }}
          />
          <button
            type="submit" disabled={!text.trim() || sending}
            className="p-2 rounded-full text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#E8533A' }}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </form>
      )}
    </div>
  )
}
