"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  title: string
  body: string | null
  type: string
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  booking: '📋', payment: '💳', checkin: '✅', dispute: '⚠️', info: '🔔',
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data) })
  }, [userId])

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-stone-50 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={19} strokeWidth={1.5} style={{ color: '#1C0F0A' }} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ background: '#E8533A' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(28,15,10,0.14)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <p className="font-semibold text-sm" style={{ color: '#1C0F0A' }}>Notificaciones</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium" style={{ color: '#E8533A' }}>
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm" style={{ color: '#8C7B75' }}>Sin notificaciones</p>
              </div>
            ) : notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                style={{ background: n.read ? 'transparent' : '#FFF8F6' }}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#1C0F0A' }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#8C7B75' }}>{n.body}</p>}
                  <p className="text-xs mt-1" style={{ color: '#C4AFA9' }}>
                    {new Date(n.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#E8533A' }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
