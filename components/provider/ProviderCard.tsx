"use client"

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { formatARS } from '@/lib/payments/format'
import { CATEGORY_LABELS, type ProviderCategory } from '@/types/provider'
import { useState } from 'react'
import { FavoriteButton } from './FavoriteButton'

type Props = {
  listing: any
  isFavorited?: boolean
  isLoggedIn?: boolean
}

export function ProviderCard({ listing, isFavorited = false, isLoggedIn = false }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/providers/${listing.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden bg-white transition-all duration-200"
        style={{ boxShadow: hovered ? '0 8px 32px rgba(232,83,58,0.12)' : '0 2px 16px rgba(28,15,10,0.06)' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
          {listing.portfolio_urls?.[0] ? (
            <img
              src={listing.portfolio_urls[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">📷</div>
          )}
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ background: 'rgba(232,83,58,0.9)', backdropFilter: 'blur(4px)' }}>
            {CATEGORY_LABELS[listing.category as ProviderCategory]}
          </span>
          <div className="absolute top-3 right-3">
            <FavoriteButton listingId={listing.id} initialFavorited={isFavorited} isLoggedIn={isLoggedIn} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate text-sm" style={{ color: '#1C0F0A' }}>{listing.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={11} strokeWidth={1.5} style={{ color: '#8C7B75' }} />
            <span className="text-xs truncate" style={{ color: '#8C7B75' }}>{listing.zone}</span>
          </div>
          <p className="font-bold mt-2 text-sm" style={{ color: '#E8533A' }}>
            desde {formatARS(listing.base_price_cents)}
          </p>
        </div>
      </div>
    </Link>
  )
}
