"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-card">
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1C0F0A' }}>
        Iniciá sesión
      </h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 transition-colors"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>Contraseña</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#E8533A' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm" style={{ color: '#8C7B75' }}>o</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full py-3 rounded-xl border border-gray-200 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        style={{ color: '#1C0F0A' }}
      >
        Continuar con Google
      </button>

      <p className="text-center mt-6 text-sm" style={{ color: '#8C7B75' }}>
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-semibold" style={{ color: '#E8533A' }}>
          Registrate gratis
        </Link>
      </p>
    </div>
  )
}
