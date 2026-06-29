import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTOTPToken } from '@/lib/auth/totp/generate'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookingId = req.nextUrl.searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })

  // Verify caller is the provider for this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('provider_id')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.provider_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: totp } = await supabase
    .from('totp_secrets')
    .select('secret')
    .eq('booking_id', bookingId)
    .single()

  if (!totp) return NextResponse.json({ error: 'TOTP not found' }, { status: 404 })

  const token = generateTOTPToken(totp.secret)
  return NextResponse.json({ token })
}
