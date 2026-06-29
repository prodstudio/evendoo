"use client"

import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'

type Props = { bookingId: string; providerName: string }

export function ProviderCheckinScreen({ bookingId, providerName }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(30)
  const [validated, setValidated] = useState(false)
  const [manualCode, setManualCode] = useState<string | null>(null)

  async function fetchToken() {
    const res = await fetch(`/api/checkin/token?booking_id=${bookingId}`)
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setManualCode(data.token.slice(0, 6))
      setCountdown(30)
    }
  }

  useEffect(() => {
    fetchToken()
    const interval = setInterval(fetchToken, 30000)
    return () => clearInterval(interval)
  }, [bookingId])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Wake Lock API
  useEffect(() => {
    let wakeLock: any = null
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch {}
    }
    requestWakeLock()
    return () => { wakeLock?.release() }
  }, [])

  // Listen for check-in validation via Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`checkin:${bookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins', filter: `booking_id=eq.${bookingId}` },
        () => setValidated(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  if (validated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FDF8F3' }}>
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#16A34A' }}>¡Check-in validado!</h1>
        <p style={{ color: '#1C0F0A' }}>Tu saldo está en camino</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#1C0F0A' }}>
      <p className="text-white text-sm mb-2 opacity-70">Mostrá este código al organizador</p>
      <p className="text-white font-semibold mb-6">{providerName}</p>

      {token ? (
        <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-4" style={{ width: '85vw', maxWidth: 340 }}>
          <QRCodeSVG value={token} size={Math.min(280, window.innerWidth * 0.7)} level="M" />

          {/* Countdown bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F0E6DF' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 30) * 100}%`, background: '#E8533A' }}
            />
          </div>
          <p className="text-xs" style={{ color: '#8C7B75' }}>Se actualiza en {countdown}s</p>

          {/* Manual fallback */}
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: '#8C7B75' }}>Código manual</p>
            <p className="text-2xl font-bold tracking-widest" style={{ color: '#1C0F0A' }}>{manualCode}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl animate-pulse" style={{ width: '85vw', maxWidth: 340, height: 340 }} />
      )}
    </div>
  )
}
