import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateTOTPToken } from '@/lib/auth/totp/validate'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { booking_id, token } = await req.json()

    // Get TOTP secret
    const { data: totp } = await supabase
      .from('totp_secrets')
      .select('secret')
      .eq('booking_id', booking_id)
      .single()

    if (!totp) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })

    // Validate token first (before attempting to write)
    const valid = validateTOTPToken(token, totp.secret)
    if (!valid) return NextResponse.json({ error: 'Código vencido. Pedile al proveedor que actualice la pantalla' }, { status: 400 })

    // Atomic insert — UNIQUE(booking_id) prevents replay; no separate existence check needed
    const { error: checkinError } = await supabase.from('checkins').insert({
      booking_id, validated_by: user.id, token_used: token
    })

    if (checkinError) {
      if (checkinError.code === '23505') {
        return NextResponse.json({ error: 'Este código ya fue usado' }, { status: 409 })
      }
      throw checkinError
    }

    // Update payment status
    const { data: updatedPayments } = await supabase.from('payments')
      .update({ status: 'CHECK_IN_VALIDADO', updated_at: new Date().toISOString() })
      .eq('booking_id', booking_id)
      .eq('type', 'balance')
      .eq('status', 'SALDO_PAGADO')
      .select('id')

    if (!updatedPayments || updatedPayments.length === 0) {
      console.warn('[checkin/validate] No balance payment updated for booking', booking_id)
    }

    return NextResponse.json({ success: true, message: '¡Llegada confirmada!' })
  } catch {
    return NextResponse.json({ error: 'No pudimos validar el check-in' }, { status: 500 })
  }
}
