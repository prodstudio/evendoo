"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, CalendarDays, MessageCircle, User, Briefcase, Heart, Inbox } from 'lucide-react'

type Tab = { href: string; label: string; icon: React.ElementType }

const HOST_TABS: Tab[] = [
  { href: '/marketplace', label: 'Explorar', icon: Compass },
  { href: '/events', label: 'Mis Eventos', icon: CalendarDays },
  { href: '/favorites', label: 'Guardados', icon: Heart },
  { href: '/bookings', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Perfil', icon: User },
]

const PROVIDER_TABS: Tab[] = [
  { href: '/marketplace', label: 'Explorar', icon: Compass },
  { href: '/proposals', label: 'Propuestas', icon: Inbox },
  { href: '/listings', label: 'Servicios', icon: Briefcase },
  { href: '/bookings', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Perfil', icon: User },
]

export function BottomNav({ isProvider = false }: { isProvider?: boolean }) {
  const pathname = usePathname()
  const tabs = isProvider ? PROVIDER_TABS : HOST_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{
      background: '#FDF8F3',
      borderTop: '1px solid #F0E6DF',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 min-w-0"
              style={{ color: active ? '#E8533A' : '#8C7B75' }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
