import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount_cents, bank_alias } = await req.json()

    if (!amount_cents || !bank_alias) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (typeof amount_cents !== 'number' || amount_cents <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    // Atomic balance check + insert via DB function (prevents double-spend race)
    const { data: withdrawalId, error } = await supabase.rpc('create_withdrawal', {
      p_provider_id: user.id,
      p_amount_cents: amount_cents,
      p_bank_alias: bank_alias,
    })

    if (error) {
      if (error.message.includes('INSUFFICIENT_BALANCE')) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
      }
      console.error('[withdrawals] rpc error', error)
      return NextResponse.json({ error: 'Error al procesar el retiro' }, { status: 500 })
    }

    // TODO: Call MercadoPago Disbursements API with bank_alias
    return NextResponse.json({ ok: true, withdrawal_id: withdrawalId })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
