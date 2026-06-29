import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Iniciá sesión para continuar' } } satisfies ApiResponse<null>, { status: 401 })

    const body = await req.json()
    const { listing_id, event_date, event_type, event_zone, description } = body

    // Get listing to find provider_id
    const { data: listing } = await supabase.from('provider_listings').select('provider_id').eq('id', listing_id).single()
    if (!listing) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Proveedor no encontrado' } } satisfies ApiResponse<null>, { status: 404 })

    // Check for existing booking
    const { data: existing } = await supabase.from('bookings')
      .select('id').eq('host_id', user.id).eq('provider_id', listing.provider_id)
      .eq('event_date', event_date).in('status', ['pending', 'accepted']).maybeSingle()

    if (existing) return NextResponse.json({ data: null, error: { code: 'DUPLICATE', message: 'Ya tenés una propuesta activa con este proveedor para esa fecha' } } satisfies ApiResponse<null>, { status: 409 })

    const { data: booking, error } = await supabase.from('bookings').insert({
      host_id: user.id, provider_id: listing.provider_id,
      listing_id, event_date, event_type, event_zone, description, status: 'pending'
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ data: null, error: { code: 'DUPLICATE', message: 'Ya tenés una propuesta activa con este proveedor para esa fecha' } } satisfies ApiResponse<null>, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ data: booking, error: null } satisfies ApiResponse<typeof booking>)
  } catch {
    return NextResponse.json({ data: null, error: { code: 'INTERNAL', message: 'No pudimos crear la propuesta' } } satisfies ApiResponse<null>, { status: 500 })
  }
}
