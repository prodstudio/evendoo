import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatARS } from '@/lib/payments/format'
import { PAYMENT_STATUS } from '@/types/payment'
import { PaymentStatusBadge } from '@/components/shared/PaymentStatus/PaymentStatusBadge'
import { BookingActions } from '@/components/booking/BookingActions'
import Link from 'next/link'
import { ChevronLeft, MessageCircle, QrCode, Calendar, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Esperando respuesta', accepted: 'Aceptada', declined: 'Rechazada', cancelled: 'Cancelada'
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#F4B942', accepted: '#16A34A', declined: '#DC2626', cancelled: '#8C7B75'
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      provider_listings(title, base_price_cents, category),
      profiles!bookings_provider_id_fkey(full_name, avatar_url),
      host_profiles:profiles!bookings_host_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()
  if (booking.host_id !== user.id && booking.provider_id !== user.id) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', id)
    .order('created_at')

  const { data: dispute } = await supabase
    .from('disputes')
    .select('*')
    .eq('booking_id', id)
    .maybeSingle()

  const userRole: 'host' | 'provider' = booking.host_id === user.id ? 'host' : 'provider'
  const otherName = userRole === 'host'
    ? (booking.profiles as any)?.full_name
    : (booking.host_profiles as any)?.full_name
  const listingTitle = (booking.provider_listings as any)?.title ?? 'Servicio'
  const basePrice = (booking.provider_listings as any)?.base_price_cents ?? 0
  const eventDate = new Date(booking.event_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const depositPayment = payments?.find(p => p.type === 'deposit')
  const balancePayment = payments?.find(p => p.type === 'balance')
  const canOpenDispute = userRole === 'host' && balancePayment &&
    [PAYMENT_STATUS.SALDO_PAGADO].includes(balancePayment.status) && !dispute

  return (
    <div className="px-6 lg:px-10 py-6 pb-28 lg:pb-8 overflow-y-auto h-full">
      <Link href="/bookings" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: '#8C7B75' }}>
        <ChevronLeft size={16} strokeWidth={1.5} />
        Mis reservas
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1C0F0A' }}>{listingTitle}</h1>
            <p className="text-sm" style={{ color: '#8C7B75' }}>{userRole === 'host' ? 'Proveedor' : 'Host'}: {otherName}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full text-white flex-shrink-0"
            style={{ background: STATUS_COLOR[booking.status] ?? '#8C7B75' }}>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            {eventDate}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1C0F0A' }}>
            <MapPin size={14} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            {booking.event_zone} · {booking.event_type}
          </div>
        </div>

        {booking.description && (
          <p className="text-sm mt-4 pt-4 border-t border-stone-100" style={{ color: '#8C7B75' }}>
            {booking.description}
          </p>
        )}
      </div>

      {/* Payments */}
      {payments && payments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#1C0F0A' }}>Pagos</h2>
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1C0F0A' }}>
                    {p.type === 'deposit' ? 'Seña' : 'Saldo'}
                  </p>
                  <p className="text-xs" style={{ color: '#8C7B75' }}>{formatARS(p.amount_cents)}</p>
                </div>
                <PaymentStatusBadge status={p.status} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between">
            <span className="text-sm font-semibold" style={{ color: '#1C0F0A' }}>Total acordado</span>
            <span className="text-sm font-bold" style={{ color: '#E8533A' }}>{formatARS(basePrice)}</span>
          </div>
        </div>
      )}

      {/* Dispute status */}
      {dispute && (
        <div className="rounded-2xl p-4 mb-4 border" style={{ background: '#FEF3C7', borderColor: '#FCD34D' }}>
          <p className="font-semibold text-sm mb-1" style={{ color: '#92400E' }}>
            ⚠️ Disputa {dispute.status === 'open' ? 'abierta' : 'resuelta'}
          </p>
          <p className="text-sm" style={{ color: '#92400E' }}>{dispute.reason}</p>
          {dispute.resolution_notes && (
            <p className="text-xs mt-2" style={{ color: '#78350F' }}>Resolución: {dispute.resolution_notes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <BookingActions
        bookingId={id}
        userRole={userRole}
        bookingStatus={booking.status}
        eventDate={booking.event_date}
        depositPayment={depositPayment ?? null}
        balancePayment={balancePayment ?? null}
        canOpenDispute={!!canOpenDispute}
        dispute={dispute ?? null}
      />
    </div>
  )
}
