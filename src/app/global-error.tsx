'use client'

import { Inter } from 'next/font/google'
import { AlertTriangle } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          background: '#09090b',
          color: '#fafafa',
          fontFamily: 'inherit'
        }}>
          <div style={{ 
            maxWidth: 480, 
            textAlign: 'center', 
            padding: '40px 32px',
            background: '#18181b',
            borderRadius: '16px',
            border: '1px solid #27272a'
          }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Critical Application Error</h1>
            <p style={{ color: '#a1a1aa', marginBottom: 24, fontSize: 15, lineHeight: 1.5 }}>
              A critical error occurred while loading the application shell. 
            </p>

            <button 
              onClick={() => reset()}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
