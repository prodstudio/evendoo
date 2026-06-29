import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

const AI_SESSION_PRICE_CENTS = 500 // $5 USD in cents

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Iniciá sesión para continuar' } } satisfies ApiResponse<null>, { status: 401 })

    const { event_id } = await req.json()

    // Check if active session already exists
    const { data: existing } = await supabase.from('ai_sessions')
      .select('id, status')
      .eq('host_id', user.id)
      .eq('event_id', event_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) return NextResponse.json({ data: existing, error: null } satisfies ApiResponse<typeof existing>)

    // Create pending session + MP payment (mock for now)
    const { data: session } = await supabase.from('ai_sessions').insert({
      host_id: user.id, event_id, status: 'pending_payment'
    }).select().single()

    // TODO: Create $5 USD MP payment preference
    const initPoint = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=AI_${session?.id}`

    return NextResponse.json({ data: { session, init_point: initPoint }, error: null } satisfies ApiResponse<any>)
  } catch {
    return NextResponse.json({ data: null, error: { code: 'INTERNAL', message: 'No pudimos iniciar la sesión' } } satisfies ApiResponse<null>, { status: 500 })
  }
}
