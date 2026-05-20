'use client'

import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: 24, textAlign: 'center', background: 'var(--surface-1)'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', marginBottom: 24
          }}>
            <AlertTriangle size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 24 }}>
            An unexpected error occurred in the application. Please try refreshing the page.
          </p>
          {this.state.error && (
            <div style={{
              background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)', marginBottom: 24, maxWidth: 600, width: '100%',
              textAlign: 'left', overflowX: 'auto'
            }}>
              <code style={{ fontSize: 12, color: 'var(--danger)' }}>{this.state.error.message}</code>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCcw size={16} /> Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
