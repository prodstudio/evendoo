import { createClient } from '@/lib/supabase/server'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'
import { ProviderCard } from '@/components/provider/ProviderCard'
import Link from 'next/link'
import { Search } from 'lucide-react'

export const revalidate = 60

type SearchParams = { category?: string; zone?: string; q?: string }

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('provider_listings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.zone) query = query.ilike('zone', `%${params.zone}%`)
  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,zone.ilike.%${params.q}%`)

  const { data: listings } = await query.limit(48)

  const { data: { user } } = await supabase.auth.getUser()

  let favoriteIds = new Set<string>()
  if (user) {
    const { data: favs } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('host_id', user.id)
    favs?.forEach(f => favoriteIds.add(f.listing_id))
  }

  const hasFilters = params.category || params.zone || params.q

  return (
    <main>
      {/* Hero search */}
      <div className="px-4 py-10 lg:py-16 text-center" style={{ background: 'linear-gradient(135deg, #FDF8F3 0%, #FFF0ED 100%)' }}>
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-2" style={{ color: '#1C0F0A' }}>
          Encontrá el proveedor ideal
        </h1>
        <p className="text-base mb-8" style={{ color: '#8C7B75' }}>
          Fotografía, DJ, catering, salones y más en toda Argentina
        </p>

        <form method="GET" action="/marketplace" className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 24px rgba(232,83,58,0.15)' }}>
            <Search size={20} strokeWidth={1.5} style={{ color: '#8C7B75', flexShrink: 0 }} />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Fotógrafo, DJ, catering, salón..."
              className="flex-1 outline-none text-base bg-transparent"
              style={{ color: '#1C0F0A' }}
            />
            {params.zone && <input type="hidden" name="zone" value={params.zone} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            <button
              type="submit"
              className="flex-shrink-0 px-5 py-2 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#E8533A' }}
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto justify-center mt-6 pb-1">
          <FilterChip label="Todos" active={!params.category} href={params.q ? `/marketplace?q=${params.q}` : '/marketplace'} />
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <FilterChip
              key={key}
              label={label}
              active={params.category === key}
              href={`/marketplace?category=${key}${params.q ? `&q=${params.q}` : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {hasFilters && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: '#8C7B75' }}>
              {listings?.length ?? 0} resultado{listings?.length !== 1 ? 's' : ''}
              {params.q ? ` para "${params.q}"` : ''}
              {params.category ? ` en ${CATEGORY_LABELS[params.category as ProviderCategory]}` : ''}
            </p>
            <Link href="/marketplace" className="text-sm font-medium" style={{ color: '#E8533A' }}>
              Limpiar filtros
            </Link>
          </div>
        )}

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map(listing => (
              <ProviderCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.has(listing.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-semibold" style={{ color: '#1C0F0A' }}>
              No encontramos proveedores
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: '#8C7B75' }}>
              Probá con otra búsqueda o explorá todas las categorías
            </p>
            <Link href="/marketplace"
              className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: '#E8533A' }}>
              Ver todos los proveedores
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}


function FilterChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{
        background: active ? '#E8533A' : 'white',
        color: active ? 'white' : '#1C0F0A',
        border: `1px solid ${active ? '#E8533A' : '#E5E7EB'}`,
      }}>
      {label}
    </Link>
  )
}
