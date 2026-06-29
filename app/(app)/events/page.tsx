import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'

export default async function EventsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, provider_listings(title, category), profiles!provider_id(full_name)')
    .eq('host_id', profile?.id)
    .order('event_date', { ascending: true })

  const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Pendiente', bg: '#FFF9E6', color: '#D97706' },
    accepted: { label: 'Confirmado', bg: '#F0FDF4', color: '#16A34A' },
    declined: { label: 'Declinado', bg: '#FEF2F2', color: '#DC2626' },
    cancelled: { label: 'Cancelado', bg: '#F3F4F6', color: '#6B7280' },
  }

  const isEmpty = !bookings || bookings.length === 0

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1C0F0A' }}>Mis Eventos</h1>
          <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>Tus contrataciones y propuestas activas</p>
        </div>
        {!isEmpty && (
          <Link href="/events/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: '#E8533A' }}>
            <Plus size={16} strokeWidth={2} />
            Nuevo evento
          </Link>
        )}
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
        <div className="space-y-3 max-w-2xl">
          {bookings.map(b => {
            const status = STATUS_MAP[b.status] || STATUS_MAP.pending
            return (
              <Link key={b.id} href={`/bookings/${b.id}/chat`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFF0ED' }}>
                  <CalendarDays size={20} strokeWidth={1.5} style={{ color: '#E8533A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#1C0F0A' }}>
                    {(b.provider_listings as any)?.title}
                  </p>
                  <p className="text-sm truncate" style={{ color: '#8C7B75' }}>
                    {(b.profiles as any)?.full_name} &middot; {new Date(b.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
