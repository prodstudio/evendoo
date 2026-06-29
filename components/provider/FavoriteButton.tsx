"use client"

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  listingId: string
  initialFavorited: boolean
  isLoggedIn: boolean
  size?: number
}

export function FavoriteButton({ listingId, initialFavorited, isLoggedIn, size = 18 }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push(`/register?redirect=/providers/${listingId}`)
      return
    }

    setLoading(true)
    const next = !favorited
    setFavorited(next)

    try {
      await fetch('/api/favorites', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
    } catch {
      setFavorited(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-transform active:scale-90"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <Heart
        size={size}
        strokeWidth={1.8}
        style={{
          color: favorited ? '#E8533A' : '#8C7B75',
          fill: favorited ? '#E8533A' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
    </button>
  )
}
