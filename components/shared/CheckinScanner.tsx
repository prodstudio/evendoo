"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type Props = { bookingId: string }
type ScanState = 'scanning' | 'loading' | 'success' | 'error'

export function CheckinScanner({ bookingId }: Props) {
  const [state, setState] = useState<ScanState>('scanning')
  const [message, setMessage] = useState('')
  const [manualToken, setManualToken] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 4, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    )
    scannerRef.current.render(
      (decodedText) => {
        if (!processedRef.current) {
          processedRef.current = true
          validate(decodedText)
        }
      },
      () => {}
    )
    return () => { scannerRef.current?.clear().catch(() => {}) }
  }, [])

  async function validate(token: string) {
    setState('loading')
    try {
      const res = await fetch('/api/checkin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, token }),
      })
      const data = await res.json()
      if (res.ok) {
        setState('success')
        setMessage(data.message ?? '¡Llegada confirmada!')
      } else {
        setState('error')
        setMessage(data.error ?? 'Error al validar')
        processedRef.current = false
      }
    } catch {
      setState('error')
      setMessage('Error de conexión')
      processedRef.current = false
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: '#DCFCE7' }}>
          <CheckCircle size={40} strokeWidth={1.5} style={{ color: '#16A34A' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#16A34A' }}>{message}</h2>
        <p className="text-sm" style={{ color: '#8C7B75' }}>El saldo quedará liberado al proveedor</p>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={36} strokeWidth={1.5} className="animate-spin" style={{ color: '#E8533A' }} />
        <p style={{ color: '#8C7B75' }}>Validando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#1C0F0A' }}>Escanear QR del proveedor</h2>
      <p className="text-sm text-center mb-6" style={{ color: '#8C7B75' }}>
        Apuntá la cámara al código QR que muestra el proveedor
      </p>

      <div id="qr-reader" className="rounded-2xl overflow-hidden" />

      {state === 'error' && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#FEE2E2' }}>
          <AlertCircle size={16} strokeWidth={1.5} style={{ color: '#DC2626' }} />
          <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{message}</p>
        </div>
      )}

      {/* Manual fallback */}
      <div className="mt-8">
        <p className="text-sm font-medium mb-2 text-center" style={{ color: '#8C7B75' }}>
          ¿No funciona la cámara? Ingresá el código manual
        </p>
        <div className="flex gap-2">
          <input
            value={manualToken}
            onChange={e => setManualToken(e.target.value.toUpperCase())}
            placeholder="Código de 6 dígitos"
            maxLength={6}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-center font-mono text-lg outline-none focus:border-orange-300"
          />
          <button
            onClick={() => { if (manualToken.length >= 6) validate(manualToken) }}
            disabled={manualToken.length < 6}
            className="px-5 py-2.5 rounded-xl font-semibold text-white disabled:opacity-40"
            style={{ background: '#E8533A' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
