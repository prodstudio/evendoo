export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FDF8F3' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold" style={{ color: '#E8533A', fontFamily: 'var(--font-jakarta)' }}>
            Evendoo
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
