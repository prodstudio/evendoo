export enum PAYMENT_STATUS {
  SEÑA_PENDIENTE = 'SEÑA_PENDIENTE',
  SEÑA_PAGADA = 'SEÑA_PAGADA',
  CANCELADO_POST_SEÑA = 'CANCELADO_POST_SEÑA',
  SALDO_PENDIENTE = 'SALDO_PENDIENTE',
  SALDO_PAGADO = 'SALDO_PAGADO',
  CHECK_IN_VALIDADO = 'CHECK_IN_VALIDADO',
  SALDO_LIBERADO = 'SALDO_LIBERADO',
  LIBERADO_POR_TIMEOUT = 'LIBERADO_POR_TIMEOUT',
  DISPUTA_ABIERTA = 'DISPUTA_ABIERTA',
  DISPUTA_RESUELTA = 'DISPUTA_RESUELTA',
}

export type Payment = {
  id: string
  booking_id: string
  type: 'deposit' | 'balance'
  amount_cents: number
  status: PAYMENT_STATUS
  mp_payment_id: string | null
  idempotency_key: string
  created_at: string
  updated_at: string
}
