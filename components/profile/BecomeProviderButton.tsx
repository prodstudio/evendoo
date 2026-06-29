"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'

export function BecomeProviderButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_provider: true }),
    })
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <p className="text-sm font-medium" style={{ color: '#16A34A' }}>
        ✅ ¡Listo! Ya sos proveedor. Recargá para ver tu nueva pantalla.
      </p>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
      style={{ background: '#E8533A' }}>
      <Briefcase size={16} strokeWidth={1.5} />
      {loading ? 'Activando...' : 'Convertirme en proveedor'}
    </button>
  )
}
