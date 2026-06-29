import { BottomNav } from '@/components/shared/BottomNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 lg:pb-0">
      {/* Top nav for desktop */}
      <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-stone-100 sticky top-0 z-40" style={{ background: '#FDF8F3' }}>
        <span className="text-2xl font-extrabold" style={{ color: '#E8533A' }}>Evendoo</span>
        <nav className="flex items-center gap-6">
          <a href="/marketplace" className="font-medium hover:text-orange-500 transition-colors" style={{ color: '#1C0F0A' }}>Explorar</a>
          <a href="/login" className="font-medium hover:text-orange-500 transition-colors" style={{ color: '#1C0F0A' }}>Ingresar</a>
          <a href="/register" className="px-4 py-2 rounded-xl text-white font-semibold" style={{ background: '#E8533A' }}>Registrarse</a>
        </nav>
      </header>
      {children}
      <BottomNav />
    </div>
  )
}
