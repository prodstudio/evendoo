import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { curateProviders } from '@/lib/ai/curator'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import type { ApiResponse } from '@/types/api'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_id, event, message } = await req.json()

    // Verify session belongs to user and is active
    const { data: session } = await supabase
      .from('ai_sessions')
      .select('id, status, conversation')
      .eq('id', session_id)
      .eq('host_id', user.id)
      .eq('status', 'active')
      .single()

    if (!session) return NextResponse.json({ error: 'Sesión no encontrada o inactiva' }, { status: 404 })

    // Detect if user is asking for provider recommendations
    const wantsProviders = /proveedor|fotógrafo|fotograf|dj|catering|salón|decorac|músi|coordinad|necesito|busco|recomend/i.test(message)

    let curatedProviders: any[] = []

    if (wantsProviders) {
      // Fetch available listings matching event date
      const { data: allListings } = await supabase
        .from('provider_listings')
        .select('id, title, category, zone, base_price_cents, description')
        .eq('is_available', true)
        .limit(60)

      if (allListings && allListings.length > 0) {
        // Extract categories from user message
        const catMap: Record<string, string> = {
          fotógrafo: 'photography', fotografía: 'photography', dj: 'dj',
          catering: 'catering', salón: 'venue', decoración: 'decoration',
          música: 'live_music', coordinador: 'coordinator',
        }
        const mentionedCats = Object.entries(catMap)
          .filter(([kw]) => message.toLowerCase().includes(kw))
          .map(([, cat]) => cat)

        const selectedIds = await curateProviders(
          {
            event_type: event.event_type,
            event_date: event.event_date,
            zone: event.zone,
            budget_cents: event.budget_cents ?? 0,
            guests: event.estimated_guests ?? 0,
            categories: mentionedCats.length > 0 ? mentionedCats : ['photography', 'dj', 'catering'],
          },
          allListings
        )

        curatedProviders = allListings.filter(l => selectedIds.includes(l.id)).slice(0, 6)
      }
    }

    // Generate conversational reply
    const systemPrompt = `Sos un asistente de planificación de eventos en Argentina. Sos amigable, conciso y útil.
Ayudás a hosts a planificar eventos encontrando los proveedores adecuados.
Si mostrás proveedores, mencioná brevemente que los seleccionaste para el evento.
Respondé siempre en español, máximo 3 oraciones.`

    // Use server-side conversation history — not client-supplied messages
    const conversationHistory = (session.conversation as any[]) ?? []

    const { text: reply } = await generateText({
      model: google('gemini-2.0-flash'),
      maxOutputTokens: 256,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: message },
      ],
    })

    // Save conversation to session
    const updatedConversation = [
      ...(session.conversation as any[] ?? []),
      { role: 'user', content: message },
      { role: 'assistant', content: reply, providers: curatedProviders.map(p => p.id) },
    ]
    await supabase.from('ai_sessions').update({ conversation: updatedConversation }).eq('id', session_id)

    return NextResponse.json({ reply, providers: curatedProviders })
  } catch (err) {
    console.error('[AI Chat]', err)
    return NextResponse.json({ reply: 'Lo siento, ocurrió un error inesperado. Intentá de nuevo en un momento.' }, { status: 500 })
  }
}
