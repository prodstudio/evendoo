import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import Link from 'next/link'
import { Plus, CalendarDays, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', profile?.id)
    .order('event_date', { ascending: true })

  const isEmpty = !events || events.length === 0

  return (
    <div className="px-6 py-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1C0F0A' }}>Mis Eventos</h1>
          <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>Tus eventos y contrataciones</p>
        </div>
        <Link href="/events/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: '#E8533A' }}>
          <Plus size={16} strokeWidth={2} />
          Nuevo evento
        </Link>
      </div>

      {isEmpty ? (
        <div className="text-center py-20 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FFF0ED' }}>
            <CalendarDays size={28} strokeWidth={1.5} style={{ color: '#E8533A' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#1C0F0A' }}>Todavía no tenés eventos</h2>
          <p className="text-sm mb-6" style={{ color: '#8C7B75' }}>
            Creá tu primer evento y empezá a buscar proveedores
          </p>
          <Link href="/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: '#E8533A' }}>
            <Plus size={18} strokeWidth={2} />
            Nuevo evento
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {events.map(ev => (
            <Link key={ev.id} href={`/events/${ev.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
              style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#FFF0ED' }}>
                <CalendarDays size={20} strokeWidth={1.5} style={{ color: '#E8533A' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: '#1C0F0A' }}>{ev.title}</p>
                <p className="text-sm truncate" style={{ color: '#8C7B75' }}>
                  {ev.event_type} · {new Date(ev.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
