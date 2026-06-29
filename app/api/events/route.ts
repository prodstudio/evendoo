import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('event_date', { ascending: true })

  return NextResponse.json({ data: events ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, event_type, event_date, zone, estimated_guests, budget_cents, notes } = await req.json()

  if (!title?.trim() || !event_type || !event_date || !zone?.trim()) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      host_id: user.id,
      title: title.trim(),
      event_type,
      event_date,
      zone: zone.trim(),
      estimated_guests: estimated_guests || null,
      budget_cents: budget_cents || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[api/events POST]', error)
    return NextResponse.json({ error: 'No se pudo crear el evento' }, { status: 500 })
  }

  return NextResponse.json({ data: event })
}
