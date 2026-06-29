import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CheckinScanner } from '@/components/shared/CheckinScanner'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HostCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, provider_listings(title), profiles!bookings_provider_id_fkey(full_name)')
    .eq('id', id)
    .eq('host_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (!booking) notFound()

  const { data: existingCheckin } = await supabase
    .from('checkins')
    .select('id, validated_at')
    .eq('booking_id', id)
    .maybeSingle()

  const providerName = (booking.profiles as any)?.full_name ?? 'Proveedor'
  const listingTitle = (booking.provider_listings as any)?.title ?? 'Servicio'

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F3' }}>
      <div className="max-w-md mx-auto px-4 pt-4">
        <Link href={`/bookings/${id}`} className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          Volver
        </Link>
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold" style={{ color: '#1C0F0A' }}>Check-in</h1>
          <p className="text-sm" style={{ color: '#8C7B75' }}>{providerName} · {listingTitle}</p>
        </div>
      </div>

      {existingCheckin ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#16A34A' }}>Check-in ya realizado</h2>
          <p className="text-sm" style={{ color: '#8C7B75' }}>
            Validado el {new Date(existingCheckin.validated_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ) : (
        <CheckinScanner bookingId={id} />
      )}
    </div>
  )
}
