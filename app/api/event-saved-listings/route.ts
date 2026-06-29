import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, listing_id } = await req.json()
  if (!event_id || !listing_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  // Verify the event belongs to this user
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', event_id)
    .eq('host_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('event_saved_listings')
    .insert({ event_id, listing_id, added_by: user.id })

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'No se pudo agregar el proveedor' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, listing_id } = await req.json()
  if (!event_id || !listing_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const { error } = await supabase
    .from('event_saved_listings')
    .delete()
    .eq('event_id', event_id)
    .eq('listing_id', listing_id)
    .eq('added_by', user.id)

  if (error) return NextResponse.json({ error: 'No se pudo quitar el proveedor' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
