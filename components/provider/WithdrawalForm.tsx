"use client"

import { useState } from 'react'
import { formatARS } from '@/lib/payments/format'
import { CheckCircle } from 'lucide-react'

type Props = { availableBalance: number }

export function WithdrawalForm({ availableBalance }: Props) {
  const [alias, setAlias] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alias.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_cents: availableBalance, bank_alias: alias }),
    })
    const data = await res.json()

    if (res.ok || data.mock) {
      setSuccess(true)
    } else {
      setError(data.error ?? 'Error al procesar')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#DCFCE7' }}>
        <CheckCircle size={18} strokeWidth={1.5} style={{ color: '#16A34A' }} />
        <p className="text-sm font-medium" style={{ color: '#15803D' }}>
          Retiro solicitado. Acreditación en 1–3 días hábiles.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold block mb-1" style={{ color: '#8C7B75' }}>
          ALIAS / CBU DE TU CUENTA
        </label>
        <input
          value={alias}
          onChange={e => setAlias(e.target.value)}
          placeholder="ej: lucas.mp o 0720461088000012345678"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-300"
        />
      </div>

      {error && <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>}

      <button
        type="submit"
        disabled={!alias.trim() || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-40"
        style={{ background: '#E8533A' }}>
        {loading ? 'Procesando...' : `Retirar ${formatARS(availableBalance)}`}
      </button>

      <p className="text-xs text-center" style={{ color: '#8C7B75' }}>
        La plataforma retiene 3% de comisión sobre el saldo final
      </p>
    </form>
  )
}
