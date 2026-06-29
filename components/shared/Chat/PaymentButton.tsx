"use client"

import { useState } from 'react'
import type { Payment } from '@/types/payment'
import { PAYMENT_STATUS } from '@/types/payment'
import { formatARS } from '@/lib/payments/format'
import { Shield } from 'lucide-react'

type Props = { payment: Payment; bookingId: string }

const PAYABLE_STATUSES = [PAYMENT_STATUS.SEÑA_PENDIENTE, PAYMENT_STATUS.SALDO_PENDIENTE]

export function PaymentButton({ payment, bookingId }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!PAYABLE_STATUSES.includes(payment.status)) return null

  const isDeposit = payment.type === 'deposit'
  const label = isDeposit ? 'Pagar seña' : 'Pagar saldo'
  const amount = formatARS(payment.amount_cents)

  async function handlePay() {
    setLoading(true)
    const res = await fetch('/api/payments/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: payment.id, booking_id: bookingId }),
    })
    const data = await res.json()
    if (data.init_point) {
      window.location.href = data.init_point
    }
    setLoading(false)
  }

  if (showConfirm) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl p-4 border-2" style={{ borderColor: '#F4B942', background: '#FFFDF0' }}>
        <p className="font-semibold text-center mb-1" style={{ color: '#1C0F0A' }}>
          {label} — {amount}
        </p>
        <p className="text-xs text-center mb-4" style={{ color: '#8C7B75' }}>
          {isDeposit ? 'El pago queda protegido hasta el check-in del día del evento' : 'Este saldo se libera al confirmar la llegada del proveedor'}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-xl border font-medium text-sm"
            style={{ color: '#8C7B75', borderColor: '#E5E7EB' }}>
            Cancelar
          </button>
          <button onClick={handlePay} disabled={loading}
            className="flex-1 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
            style={{ background: '#E8533A' }}>
            {loading ? 'Procesando...' : 'Confirmar y pagar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-opacity hover:opacity-90"
      style={{ background: '#F4B942', color: '#1C0F0A' }}
    >
      <Shield size={16} strokeWidth={1.5} />
      <span>{label} — {amount}</span>
    </button>
  )
}
