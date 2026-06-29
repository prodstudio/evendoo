"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message.includes('already') ? 'Ya tenés una cuenta. ¿Querés iniciar sesión?' : 'No pudimos crear tu cuenta')
    } else {
      router.push('/onboarding')
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
        Creá tu cuenta
      </h1>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 transition-colors"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>Contraseña</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 transition-colors"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C0F0A' }}>Confirmá tu contraseña</label>
          <input
            type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#E8533A' }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta — es gratis'}
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
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#E8533A' }}>
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
