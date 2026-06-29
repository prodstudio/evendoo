import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ProviderCheckinScreen } from '@/components/provider/QRCheckin/ProviderCheckinScreen'

export const dynamic = 'force-dynamic'

export default async function ProviderCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, profiles!bookings_provider_id_fkey(full_name)')
    .eq('id', id)
    .eq('provider_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (!booking) notFound()

  const providerName = (booking.profiles as any)?.full_name ?? 'Proveedor'

  return <ProviderCheckinScreen bookingId={id} providerName={providerName} />
}
