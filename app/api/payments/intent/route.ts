import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Iniciá sesión para continuar' } } satisfies ApiResponse<null>, { status: 401 })

    const { payment_id, booking_id } = await req.json()

    // Verify the payment belongs to a booking where this user is the host
    const { data: payment } = await supabase
      .from('payments')
      .select('*, bookings!inner(host_id)')
      .eq('id', payment_id)
      .eq('bookings.host_id', user.id)
      .single()

    if (!payment) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } } satisfies ApiResponse<null>, { status: 404 })

    // TODO: Create Mercado Pago preference and return init_point
    // This requires MP credentials. Returning mock for now.
    const mockResponse = {
      init_point: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=MOCK_${payment_id}`,
      preference_id: `MOCK_${payment_id}`,
    }

    return NextResponse.json({ data: mockResponse, error: null } satisfies ApiResponse<typeof mockResponse>)
  } catch {
    return NextResponse.json({ data: null, error: { code: 'INTERNAL', message: 'No pudimos procesar el pago' } } satisfies ApiResponse<null>, { status: 500 })
  }
}
