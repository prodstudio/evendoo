import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { is_provider } = await req.json()

  // Only allow enabling provider role (can't downgrade here)
  if (is_provider !== true) {
    return NextResponse.json({ error: 'Solo se puede habilitar el rol proveedor' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_provider: true })
    .eq('id', user.id)

  if (error) {
    console.error('[profile PATCH]', error)
    return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
