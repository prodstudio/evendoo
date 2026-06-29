"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Briefcase, Users } from 'lucide-react'

const ROLES = [
  { id: 'host', label: 'Organizador', desc: 'Quiero organizar eventos', icon: CalendarDays, isProvider: false },
  { id: 'provider', label: 'Proveedor', desc: 'Ofrezco servicios para eventos', icon: Briefcase, isProvider: true },
  { id: 'both', label: 'Ambos', desc: 'Organizo y ofrezco servicios', icon: Users, isProvider: true },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    const role = ROLES.find(r => r.id === selected)!
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ is_provider: role.isProvider }).eq('id', user.id)
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-card">
      <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1C0F0A' }}>¿Cómo vas a usar Evendoo?</h1>
      <p className="text-center text-sm mb-6" style={{ color: '#8C7B75' }}>Podés cambiarlo después desde tu perfil</p>

      <div className="space-y-3">
        {ROLES.map(role => {
          const Icon = role.icon
          const isSelected = selected === role.id
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: isSelected ? '#E8533A' : '#E5E7EB',
                background: isSelected ? '#FFF0ED' : 'white',
              }}
            >
              <div className="p-2 rounded-lg" style={{ background: isSelected ? '#E8533A' : '#F5EDE6' }}>
                <Icon size={20} style={{ color: isSelected ? 'white' : '#8C7B75' }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#1C0F0A' }}>{role.label}</p>
                <p className="text-sm" style={{ color: '#8C7B75' }}>{role.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected || loading}
        className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: '#E8533A' }}
      >
        {loading ? 'Configurando...' : 'Continuar'}
      </button>
    </div>
  )
}
