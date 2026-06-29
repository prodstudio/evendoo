import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'
import { ProviderCard } from '@/components/provider/ProviderCard'
import Link from 'next/link'
import { Search } from 'lucide-react'

type SearchParams = { category?: string; q?: string }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  let query = supabase
    .from('provider_listings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,zone.ilike.%${params.q}%`)

  const { data: listings } = await query.limit(48)

  const firstName = profile?.full_name?.split(' ')[0] || 'bienvenido'

  return (
    <div>
      {/* Hero search — same as marketplace */}
      <div className="px-6 py-8 lg:py-10" style={{ background: 'linear-gradient(135deg, #FDF8F3 0%, #FFF0ED 100%)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: '#E8533A' }}>Hola, {firstName} 👋</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mb-6" style={{ color: '#1C0F0A' }}>
          Encontrá el proveedor ideal
        </h1>

        <form method="GET" action="/dashboard" className="max-w-2xl">
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
            {params.category && <input type="hidden" name="category" value={params.category} />}
            <button type="submit"
              className="flex-shrink-0 px-5 py-2 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#E8533A' }}>
              Buscar
            </button>
          </div>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          <FilterChip label="Todos" active={!params.category}
            href={params.q ? `/dashboard?q=${params.q}` : '/dashboard'} />
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <FilterChip key={key} label={label} active={params.category === key}
              href={`/dashboard?category=${key}${params.q ? `&q=${params.q}` : ''}`} />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-6 py-6">
        {(params.q || params.category) && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: '#8C7B75' }}>
              {listings?.length ?? 0} resultado{listings?.length !== 1 ? 's' : ''}
              {params.q ? ` para "${params.q}"` : ''}
            </p>
            <Link href="/dashboard" className="text-sm font-medium" style={{ color: '#E8533A' }}>
              Limpiar
            </Link>
          </div>
        )}

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {listings.map(listing => (
              <ProviderCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: '#1C0F0A' }}>Sin resultados</p>
            <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>Probá con otra búsqueda</p>
            <Link href="/dashboard" className="inline-block mt-4 px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: '#E8533A' }}>
              Ver todos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link href={href}
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
