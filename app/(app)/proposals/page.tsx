import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Inbox, CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_provider')
    .eq('id', user.id)
    .single()

  if (!profile?.is_provider) redirect('/dashboard')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, category),
      host:profiles!bookings_host_id_fkey(full_name)
    `)
    .eq('provider_id', user.id)
    .in('status', ['pending', 'accepted'])
    .order('event_date', { ascending: true })

  const pending  = bookings?.filter(b => b.status === 'pending')  ?? []
  const accepted = bookings?.filter(b => b.status === 'accepted') ?? []

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: '#1C0F0A' }}>Propuestas</h1>
        <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>Solicitudes de hosts y tus próximos eventos</p>
      </div>

      {/* Pending requests */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8C7B75' }}>
          Solicitudes pendientes {pending.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-full text-white text-xs" style={{ background: '#E8533A' }}>{pending.length}</span>}
        </h2>

        {pending.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
            <Inbox size={32} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: '#8C7B75' }} />
            <p className="text-sm" style={{ color: '#8C7B75' }}>No tenés solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(b => (
              <Link key={b.id} href={`/proposals/${b.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFF0ED' }}>
                  <Inbox size={20} strokeWidth={1.5} style={{ color: '#E8533A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#1C0F0A' }}>
                    {(b.host as any)?.full_name ?? 'Host'}
                  </p>
                  <p className="text-sm truncate" style={{ color: '#8C7B75' }}>
                    {(b.provider_listings as any)?.title} · {new Date(b.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: '#FFF9E6', color: '#D97706' }}>
                  Pendiente
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming accepted events */}
      {accepted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8C7B75' }}>
            Próximos eventos
          </h2>
          <div className="space-y-3">
            {accepted.map(b => (
              <Link key={b.id} href={`/bookings/${b.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F0FDF4' }}>
                  <CalendarDays size={20} strokeWidth={1.5} style={{ color: '#16A34A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#1C0F0A' }}>
                    {(b.host as any)?.full_name ?? 'Host'}
                  </p>
                  <p className="text-sm truncate" style={{ color: '#8C7B75' }}>
                    {(b.provider_listings as any)?.title} · {new Date(b.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: '#F0FDF4', color: '#16A34A' }}>
                  Confirmado
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
