import { PAYMENT_STATUS } from '@/types/payment'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  [PAYMENT_STATUS.SEÑA_PENDIENTE]: { label: 'Seña pendiente', bg: '#FFF9E6', color: '#D97706' },
  [PAYMENT_STATUS.SEÑA_PAGADA]: { label: 'Seña pagada', bg: '#F0FDF4', color: '#16A34A' },
  [PAYMENT_STATUS.CANCELADO_POST_SEÑA]: { label: 'Cancelado', bg: '#F3F4F6', color: '#6B7280' },
  [PAYMENT_STATUS.SALDO_PENDIENTE]: { label: 'Saldo pendiente', bg: '#EFF6FF', color: '#2563EB' },
  [PAYMENT_STATUS.SALDO_PAGADO]: { label: 'Saldo pagado', bg: '#F0FDF4', color: '#16A34A' },
  [PAYMENT_STATUS.CHECK_IN_VALIDADO]: { label: 'Check-in ✓', bg: '#16A34A', color: 'white' },
  [PAYMENT_STATUS.SALDO_LIBERADO]: { label: 'Saldo liberado', bg: '#16A34A', color: 'white' },
  [PAYMENT_STATUS.LIBERADO_POR_TIMEOUT]: { label: 'Liberado automáticamente', bg: '#F0FDF4', color: '#16A34A' },
  [PAYMENT_STATUS.DISPUTA_ABIERTA]: { label: 'Disputa abierta', bg: '#FEF2F2', color: '#DC2626' },
  [PAYMENT_STATUS.DISPUTA_RESUELTA]: { label: 'Disputa resuelta', bg: '#F3F4F6', color: '#6B7280' },
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      className="text-xs font-semibold px-2 py-1 rounded-full"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
