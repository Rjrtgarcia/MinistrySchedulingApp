import Link from 'next/link'
import { Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="animate-fade-in" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24,
      background: 'var(--background)'
    }}>
      <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: '50%', 
          background: 'var(--surface-3)', 
          color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Compass size={32} />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you might have a typo in the URL.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary">
            <Home size={16} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
