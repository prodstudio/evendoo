import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { booking_id, reason } = await req.json()
    if (!booking_id || !reason) return NextResponse.json({ error: 'booking_id and reason are required' }, { status: 400 })

    // Verify caller is the host of this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('host_id, provider_id')
      .eq('id', booking_id)
      .eq('host_id', user.id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking no encontrado' }, { status: 404 })

    // Check no open dispute already exists
    const { data: existing } = await supabase
      .from('disputes')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('status', 'open')
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Ya existe una disputa abierta para esta reserva' }, { status: 409 })

    // Update payment status FIRST — prevents cron from releasing funds during dispute insert
    await supabase
      .from('payments')
      .update({ status: 'DISPUTA_ABIERTA', updated_at: new Date().toISOString() })
      .eq('booking_id', booking_id)
      .in('status', ['SALDO_PAGADO', 'CHECK_IN_VALIDADO'])

    // Open dispute
    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({ booking_id, opened_by: user.id, reason })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify provider
    await createNotification(
      booking.provider_id,
      'Disputa abierta',
      `El organizador abrió una disputa: "${reason}"`,
      'dispute',
      `/bookings/${booking_id}`
    )

    return NextResponse.json({ ok: true, dispute })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
