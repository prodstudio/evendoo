import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

type EventContext = {
  event_type: string
  event_date: string
  zone: string
  budget_cents: number
  guests: number
  categories: string[]
}

export async function curateProviders(context: EventContext, availableProviders: any[]) {
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    maxOutputTokens: 1024,
    messages: [
      {
        role: 'system',
        content: `Sos un asistente de planificación de eventos para Argentina.
Tu tarea es seleccionar los mejores proveedores de la lista disponible para el evento del usuario.
Respondé SOLO con un JSON array de IDs de proveedores seleccionados (máximo 4 por categoría).
No incluyas explicaciones, solo el JSON.`
      },
      {
        role: 'user',
        content: `Evento: ${context.event_type} en ${context.zone} el ${context.event_date}
Presupuesto total: $${context.budget_cents / 100} ARS
Invitados: ${context.guests}
Categorías necesarias: ${context.categories.join(', ')}

Proveedores disponibles:
${JSON.stringify(availableProviders.map(p => ({
  id: p.id,
  title: p.title,
  category: p.category,
  zone: p.zone,
  price: p.base_price_cents / 100,
  description: p.description?.slice(0, 100)
})), null, 2)}

Seleccioná máximo 4 proveedores por categoría que mejor se adapten al evento y presupuesto.
Respondé con: {"selected_ids": ["id1", "id2", ...]}`
      }
    ]
  })

  try {
    const parsed = JSON.parse(text.trim())
    return parsed.selected_ids as string[]
  } catch {
    return availableProviders.slice(0, 4).map(p => p.id)
  }
}
