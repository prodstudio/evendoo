import { createClient } from '@/lib/supabase/server'
import { ProviderCard } from '@/components/provider/ProviderCard'
import { Heart } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('favorites')
    .select('listing_id, provider_listings(*, profiles(full_name, avatar_url))')
    .eq('host_id', user!.id)
    .order('created_at', { ascending: false })

  const listings = favorites?.map(f => f.provider_listings).filter(Boolean) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: '#1C0F0A' }}>Guardados</h1>
        <p className="text-sm mt-1" style={{ color: '#8C7B75' }}>
          {listings.length} proveedor{listings.length !== 1 ? 'es' : ''} guardado{listings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing: any) => (
            <ProviderCard
              key={listing.id}
              listing={listing}
              isFavorited={true}
              isLoggedIn={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: '#FFF0ED' }}>
            <Heart size={28} strokeWidth={1.5} style={{ color: '#E8533A' }} />
          </div>
          <p className="text-lg font-semibold mb-1" style={{ color: '#1C0F0A' }}>
            Todavía no guardaste ningún proveedor
          </p>
          <p className="text-sm mb-6" style={{ color: '#8C7B75' }}>
            Tocá el corazón en cualquier proveedor para guardarlo acá
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: '#E8533A' }}>
            Explorar proveedores
          </Link>
        </div>
      )}
    </div>
  )
}
