import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'
import { ProviderCardForEvent } from '@/components/events/ProviderCardForEvent'
import Link from 'next/link'
import { ChevronLeft, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = { category?: string; q?: string }

export default async function EventProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id: eventId } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, event_type, zone')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  // Listings query
  let query = supabase
    .from('provider_listings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (sp.category) query = query.eq('category', sp.category)
  if (sp.q) query = query.or(`title.ilike.%${sp.q}%,description.ilike.%${sp.q}%,zone.ilike.%${sp.q}%`)

  const { data: listings } = await query.limit(48)

  // Already saved listing IDs for this event
  const { data: saved } = await supabase
    .from('event_saved_listings')
    .select('listing_id')
    .eq('event_id', eventId)
    .eq('added_by', user.id)

  const savedIds = new Set(saved?.map(s => s.listing_id) ?? [])

  const baseUrl = `/events/${eventId}/providers`

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#FDF8F3' }}>

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 px-6 lg:px-10 py-4">
        <Link href={`/events/${eventId}`}
          className="inline-flex items-center gap-1 text-sm mb-3 font-medium"
          style={{ color: '#8C7B75' }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
          {event.title}
        </Link>

        <h1 className="text-lg font-extrabold mb-3" style={{ color: '#1C0F0A' }}>
          Buscar proveedores
        </h1>

        {/* Search */}
        <form method="GET" action={baseUrl}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
            <Search size={16} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Fotógrafo, DJ, catering, salón..."
              className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: '#1C0F0A' }}
            />
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <button type="submit" className="flex-shrink-0 px-3 py-1 rounded-lg text-white text-xs font-semibold"
              style={{ background: '#E8533A' }}>
              Buscar
            </button>
          </div>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-6 px-6 lg:-mx-10 lg:px-10">
          <FilterChip label="Todos" active={!sp.category}
            href={sp.q ? `${baseUrl}?q=${sp.q}` : baseUrl} />
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <FilterChip key={key} label={label} active={sp.category === key}
              href={sp.q ? `${baseUrl}?category=${key}&q=${sp.q}` : `${baseUrl}?category=${key}`} />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
        {!listings || listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-1" style={{ color: '#1C0F0A' }}>Sin resultados</p>
            <p className="text-sm" style={{ color: '#8C7B75' }}>Probá con otros términos o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <ProviderCardForEvent
                key={listing.id}
                listing={listing}
                eventId={eventId}
                initialSaved={savedIds.has(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link href={href}
      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
      style={{
        background: active ? '#E8533A' : '#F3F4F6',
        color: active ? 'white' : '#6B7280',
      }}>
      {label}
    </Link>
  )
}
