import { NextRequest, NextResponse } from 'next/server'

// MP webhook handler — full implementation requires MP SDK + service role Supabase client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    // TODO: Validate MP signature header (x-signature)
    // TODO: Use service role Supabase client to update payment status
    // TODO: Implement idempotency check via idempotency_keys table
    // TODO: On payment.updated with status=approved → update payments.status to SEÑA_PAGADA or SALDO_PAGADO

    console.log('[MP Webhook]', type, data?.id)
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
