"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, QrCode, AlertTriangle, ScanLine } from 'lucide-react'
import type { Payment } from '@/types/payment'
import { PAYMENT_STATUS } from '@/types/payment'
import { PaymentButton } from '@/components/shared/Chat/PaymentButton'

type Props = {
  bookingId: string
  userRole: 'host' | 'provider'
  bookingStatus: string
  eventDate: string
  depositPayment: Payment | null
  balancePayment: Payment | null
  canOpenDispute: boolean
  dispute: any
}

const DISPUTE_REASONS = [
  'El proveedor no se presentó',
  'El proveedor llegó con mucho retraso',
  'El servicio fue distinto al acordado',
  'El proveedor canceló sin previo aviso',
]

export function BookingActions({ bookingId, userRole, bookingStatus, eventDate, depositPayment, balancePayment, canOpenDispute, dispute }: Props) {
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function openDispute() {
    const reason = selectedReason === 'other' ? customReason : selectedReason
    if (!reason.trim()) return
    setSubmitting(true)
    await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, reason }),
    })
    setSubmitting(false)
    setShowDisputeModal(false)
    router.refresh()
  }

  const daysUntilEvent = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000)
  const balanceLocked = balancePayment?.status === PAYMENT_STATUS.SALDO_PENDIENTE && daysUntilEvent > 5

  const activePayment = depositPayment?.status === PAYMENT_STATUS.SEÑA_PENDIENTE ? depositPayment
    : (balancePayment?.status === PAYMENT_STATUS.SALDO_PENDIENTE && !balanceLocked) ? balancePayment
    : null

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Chat */}
        {bookingStatus === 'accepted' && (
          <Link
            href={`/bookings/${bookingId}/chat`}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white"
            style={{ background: '#E8533A' }}>
            <MessageCircle size={18} strokeWidth={1.5} />
            Abrir chat
          </Link>
        )}

        {/* Payment */}
        {activePayment && userRole === 'host' && (
          <PaymentButton payment={activePayment} bookingId={bookingId} />
        )}

        {/* Balance locked until 5 days before event */}
        {balanceLocked && userRole === 'host' && depositPayment?.status !== PAYMENT_STATUS.SEÑA_PENDIENTE && (
          <p className="text-xs text-center px-4 py-2 rounded-xl" style={{ background: '#F9F3EE', color: '#8C7B75' }}>
            El pago del saldo se habilita 5 días antes del evento ({daysUntilEvent} días restantes)
          </p>
        )}

        {/* Provider: show QR for check-in */}
        {userRole === 'provider' && bookingStatus === 'accepted' && (
          <Link
            href={`/bookings/${bookingId}/checkin`}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold border"
            style={{ color: '#1C0F0A', borderColor: '#E5E7EB' }}>
            <QrCode size={18} strokeWidth={1.5} />
            Mostrar QR de llegada
          </Link>
        )}

        {/* Host: scan check-in QR */}
        {userRole === 'host' && bookingStatus === 'accepted' && balancePayment?.status === PAYMENT_STATUS.SALDO_PAGADO && (
          <Link
            href={`/events/${bookingId}/checkin`}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold border"
            style={{ color: '#1C0F0A', borderColor: '#E5E7EB' }}>
            <ScanLine size={18} strokeWidth={1.5} />
            Escanear QR del proveedor
          </Link>
        )}

        {/* Dispute */}
        {canOpenDispute && !dispute && (
          <button
            onClick={() => setShowDisputeModal(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
            style={{ color: '#DC2626', border: '1px solid #FCA5A5', background: '#FEF2F2' }}>
            <AlertTriangle size={16} strokeWidth={1.5} />
            Abrir disputa
          </button>
        )}
      </div>

      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4"
          style={{ background: 'rgba(28,15,10,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDisputeModal(false) }}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#1C0F0A' }}>Abrir disputa</h3>
            <p className="text-sm mb-4" style={{ color: '#8C7B75' }}>Seleccioná el motivo de la disputa</p>

            <div className="space-y-2 mb-4">
              {DISPUTE_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: selectedReason === reason ? '#E8533A' : '#E5E7EB',
                    background: selectedReason === reason ? '#FFF0ED' : 'white',
                    color: selectedReason === reason ? '#E8533A' : '#1C0F0A',
                  }}>
                  {reason}
                </button>
              ))}
              <button
                onClick={() => setSelectedReason('other')}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: selectedReason === 'other' ? '#E8533A' : '#E5E7EB',
                  background: selectedReason === 'other' ? '#FFF0ED' : 'white',
                  color: selectedReason === 'other' ? '#E8533A' : '#1C0F0A',
                }}>
                Otro motivo
              </button>
            </div>

            {selectedReason === 'other' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Describí el problema..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-300 mb-4 resize-none"
              />
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium text-sm"
                style={{ color: '#8C7B75', borderColor: '#E5E7EB' }}>
                Cancelar
              </button>
              <button
                onClick={openDispute}
                disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || submitting}
                className="flex-1 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-40"
                style={{ background: '#DC2626' }}>
                {submitting ? 'Enviando...' : 'Confirmar disputa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
