'use client' // Error components must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Application error:', error)
  }, [error])

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
          background: 'rgba(239, 68, 68, 0.15)', 
          color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <AlertTriangle size={32} />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Something went wrong!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
          An unexpected error occurred. We&apos;ve logged the issue, but you can try recovering the page or returning home.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            background: 'var(--surface-2)', 
            padding: 12, borderRadius: 'var(--radius-md)', 
            marginBottom: 24, textAlign: 'left',
            border: '1px solid var(--surface-border)',
            overflowX: 'auto'
          }}>
            <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>Dev Only Error:</p>
            <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{error.message}</code>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => reset()}
          >
            <RefreshCw size={16} /> Try again
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            <Home size={16} /> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
