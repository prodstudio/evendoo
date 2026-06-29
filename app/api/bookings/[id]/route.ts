import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTOTPSecret } from '@/lib/auth/totp/generate'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json()
  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  if (action === 'decline') {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'declined' })
      .eq('id', id)
      .eq('provider_id', user.id)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: 'No se pudo rechazar la propuesta' }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  // accept: use SECURITY DEFINER function to atomically create payments + TOTP
  const secret = generateTOTPSecret()
  const { error } = await supabase.rpc('accept_booking', {
    p_booking_id: id,
    p_totp_secret: secret,
  })

  if (error) {
    if (error.message.includes('BOOKING_NOT_FOUND_OR_UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Propuesta no encontrada o sin permiso' }, { status: 404 })
    }
    console.error('[bookings/[id] PATCH]', error)
    return NextResponse.json({ error: 'No se pudo aceptar la propuesta' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: 'accepted' })
}
