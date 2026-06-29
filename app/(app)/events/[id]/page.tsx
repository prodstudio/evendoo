import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, MapPin, Users, DollarSign, Sparkles, Plus } from 'lucide-react'
import { formatARS } from '@/lib/payments/format'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, provider_listings(title, category), profiles!bookings_provider_id_fkey(full_name)')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const eventDate = new Date(event.event_date).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
    pending:  { label: 'Pendiente',  bg: '#FFF9E6', color: '#D97706' },
    accepted: { label: 'Confirmado', bg: '#F0FDF4', color: '#16A34A' },
    declined: { label: 'Declinado',  bg: '#FEF2F2', color: '#DC2626' },
    cancelled:{ label: 'Cancelado',  bg: '#F3F4F6', color: '#6B7280' },
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 lg:pb-8 overflow-y-auto h-full">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: '#8C7B75' }}>
        <ChevronLeft size={16} strokeWidth={1.5} />
        Mis Eventos
      </Link>

      <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
        <h1 className="text-xl font-extrabold mb-4" style={{ color: '#1C0F0A' }}>{event.title}</h1>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
            {eventDate}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <MapPin size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
            {event.zone} · {event.event_type}
          </div>
          {event.estimated_guests && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
              <Users size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
              {event.estimated_guests} invitados estimados
            </div>
          )}
          {event.budget_cents && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
              <DollarSign size={14} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
              Presupuesto: {formatARS(event.budget_cents)}
            </div>
          )}
        </div>
        {event.notes && (
          <p className="text-sm mt-4 pt-4 border-t border-stone-100" style={{ color: '#8C7B75' }}>{event.notes}</p>
        )}
      </div>

      <Link href={`/events/${id}/ai`}
        className="flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #E8533A 0%, #FF7A5C 100%)' }}>
        <Sparkles size={20} strokeWidth={1.5} className="text-white flex-shrink-0" />
        <div>
          <p className="font-semibold text-white text-sm">Planificador IA</p>
          <p className="text-xs text-white opacity-80">Encontrá los mejores proveedores para tu evento</p>
        </div>
      </Link>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold" style={{ color: '#1C0F0A' }}>Proveedores contactados</h2>
        <Link href="/marketplace"
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl"
          style={{ background: '#FFF0ED', color: '#E8533A' }}>
          <Plus size={12} strokeWidth={2} />
          Buscar más
        </Link>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <p className="text-sm mb-3" style={{ color: '#8C7B75' }}>Todavía no contactaste ningún proveedor para este evento.</p>
          <Link href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: '#E8533A' }}>
            Explorar proveedores
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const status = STATUS_MAP[b.status] ?? STATUS_MAP.pending
            return (
              <Link key={b.id} href={`/bookings/${b.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm" style={{ color: '#1C0F0A' }}>
                    {(b.profiles as any)?.full_name}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#8C7B75' }}>
                    {(b.provider_listings as any)?.title}
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
