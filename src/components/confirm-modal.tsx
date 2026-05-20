'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'
  const iconColor = variant === 'danger' ? 'var(--danger)' : variant === 'warning' ? 'var(--warning)' : 'var(--primary-400)'

  return (
    <div className="modal-backdrop" onClick={onCancel} style={{ zIndex: 100 }}>
      <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', 
              background: `color-mix(in srgb, ${iconColor} 15%, transparent)`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor
            }}>
              <AlertTriangle size={20} />
            </div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={18} /></button>
        </div>
        
        <div className="modal-body" style={{ paddingTop: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        
        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={`btn ${variantClass}`} onClick={() => { onConfirm(); onCancel(); }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
