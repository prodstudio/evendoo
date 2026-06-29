import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatARS } from '@/lib/payments/format'
import { WithdrawalForm } from '@/components/provider/WithdrawalForm'
import { BecomeProviderButton } from '@/components/profile/BecomeProviderButton'
import { PAYMENT_STATUS } from '@/types/payment'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // For providers: compute available balance
  let availableBalance = 0
  if (profile?.is_provider) {
    const { data: releasedPayments } = await supabase
      .from('payments')
      .select('amount_cents, bookings!inner(provider_id)')
      .in('status', [PAYMENT_STATUS.SALDO_LIBERADO, PAYMENT_STATUS.LIBERADO_POR_TIMEOUT])
      .eq('bookings.provider_id', user.id)
    availableBalance = releasedPayments?.reduce((sum: number, p: any) => sum + p.amount_cents, 0) ?? 0
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 lg:pb-8">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: '#1C0F0A' }}>Mi perfil</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold"
            style={{ background: '#E8533A' }}>
            {profile?.full_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: '#1C0F0A' }}>{profile?.full_name ?? '—'}</p>
            <p className="text-sm" style={{ color: '#8C7B75' }}>{user.email}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#E8533A' }}>
              {profile?.is_provider ? 'Host · Proveedor' : 'Host'}
            </p>
          </div>
        </div>
      </div>

      {/* Non-providers: offer to become a provider */}
      {!profile?.is_provider && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <h2 className="font-semibold mb-1" style={{ color: '#1C0F0A' }}>¿Ofrecés servicios para eventos?</h2>
          <p className="text-sm mb-4" style={{ color: '#8C7B75' }}>
            Habilitá tu perfil como proveedor para recibir propuestas de hosts y cobrar por tus servicios.
          </p>
          <BecomeProviderButton />
        </div>
      )}

      {/* Provider: balance & withdrawal */}
      {profile?.is_provider && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 16px rgba(28,15,10,0.06)' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#1C0F0A' }}>Saldo disponible</h2>
          <p className="text-3xl font-extrabold mb-1" style={{ color: '#E8533A' }}>
            {formatARS(availableBalance)}
          </p>
          <p className="text-xs mb-6" style={{ color: '#8C7B75' }}>
            Fondos liberados listos para retirar
          </p>
          {availableBalance > 0 ? (
            <WithdrawalForm availableBalance={availableBalance} />
          ) : (
            <p className="text-sm" style={{ color: '#8C7B75' }}>
              Los fondos aparecerán aquí cuando un host confirme tu llegada o transcurran 4 horas del evento.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
