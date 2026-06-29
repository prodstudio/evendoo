"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, CalendarDays, LogOut, ChevronDown, User, Briefcase, Inbox, MessageCircle } from 'lucide-react'
import type { Profile } from '@/types/user'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BottomNav } from './BottomNav'
import { NotificationBell } from './NotificationBell'
import { useState, useRef, useEffect } from 'react'

type Props = { profile: Profile; children: React.ReactNode }

const HOST_NAV = [
  { href: '/dashboard', label: 'Explorar', icon: Compass },
  { href: '/events', label: 'Mis Eventos', icon: CalendarDays },
]

const PROVIDER_NAV = [
  { href: '/dashboard', label: 'Explorar', icon: Compass },
  { href: '/proposals', label: 'Propuestas', icon: Inbox },
  { href: '/listings', label: 'Mis servicios', icon: Briefcase },
  { href: '/bookings', label: 'Conversaciones', icon: MessageCircle },
  { href: '/events', label: 'Mis Eventos', icon: CalendarDays },
]

export function AppShell({ profile, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const NAV = profile.is_provider ? PROVIDER_NAV : HOST_NAV

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/marketplace')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#FDF8F3' }}>

      {/* Top bar — logo + avatar only */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-stone-100 z-40">
        <Link href="/dashboard">
          <span className="text-2xl font-extrabold" style={{ color: '#E8533A' }}>Evendoo</span>
        </Link>

        <div className="flex items-center gap-2">
        <NotificationBell userId={profile.id} />

        {/* Avatar with dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: '#E8533A' }}>
              {profile.full_name?.[0] || '?'}
            </div>
            <ChevronDown size={14} strokeWidth={2} style={{ color: '#8C7B75' }} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl py-2 z-50"
              style={{ boxShadow: '0 8px 32px rgba(28,15,10,0.12)' }}>
              <div className="px-4 py-2 border-b border-stone-100">
                <p className="font-semibold text-sm truncate" style={{ color: '#1C0F0A' }}>{profile.full_name}</p>
                <p className="text-xs" style={{ color: '#8C7B75' }}>{profile.is_provider ? 'Host · Proveedor' : 'Host'}</p>
              </div>
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                style={{ color: '#1C0F0A' }}>
                <User size={15} strokeWidth={1.5} />
                Mi perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                style={{ color: '#DC2626' }}>
                <LogOut size={15} strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT sidebar — nav only, no avatar, no quick actions */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-stone-100 bg-white overflow-y-auto">
          <nav className="p-3 pt-4 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? '#FFF0ED' : 'transparent',
                    color: active ? '#E8533A' : '#1C0F0A',
                  }}>
                  <Icon size={17} strokeWidth={1.5} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* MAIN content */}
        <main className="flex-1 overflow-hidden pb-20 lg:pb-0 flex flex-col">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav isProvider={profile.is_provider} />
    </div>
  )
}
