'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { format } from 'date-fns'
import { Repeat, CheckCircle, XCircle, Clock, Users, MessageSquare, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/confirm-modal'

export default function SwapsPage() {
  const { swapRequests, updateSwapRequestStatus, shifts, events, users, skills, userSkills, updateShiftStatus } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [declineId, setDeclineId] = useState<string | null>(null)

  const filtered = swapRequests
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const getShiftInfo = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (!shift) return null
    const event = events.find(e => e.id === shift.event_id)
    const user = users.find(u => u.id === shift.user_id)
    const skill = skills.find(s => s.id === shift.skill_id)
    
    // Find how many other volunteers have this skill
    const potentialReplacements = shift.skill_id 
      ? userSkills.filter(us => us.skill_id === shift.skill_id && us.user_id !== shift.user_id).length
      : 0
      
    return { shift, event, user, skill, potentialReplacements }
  }

  const handleAccept = (id: string, shiftId: string) => {
    updateSwapRequestStatus(id, 'accepted')
    updateShiftStatus(shiftId, 'swapping')
    toast.success('Swap request accepted — reassign the shift to another volunteer')
  }

  const handleDecline = (id: string) => {
    updateSwapRequestStatus(id, 'declined')
    toast.error('Swap request declined')
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning'
      case 'accepted': return 'badge-success'
      case 'declined': return 'badge-danger'
      case 'cancelled': return 'badge-neutral'
      default: return 'badge-neutral'
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Swap Requests</h1>
          <p className="page-subtitle">{swapRequests.filter(r => r.status === 'pending').length} pending request{swapRequests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
          <button key={f} className={`tab ${filter === f ? 'tab-active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && swapRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 6 }}>{swapRequests.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Repeat size={28} /></div>
            <h3 className="empty-state-title">No swap requests</h3>
            <p className="empty-state-text">{filter === 'all' ? 'No swap requests have been made yet' : `No ${filter} swap requests`}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((req, i) => {
            const info = getShiftInfo(req.shift_id)
            const requester = users.find(u => u.id === req.requested_by)
            const offeredTo = req.offered_to ? users.find(u => u.id === req.offered_to) : null

            return (
              <div key={req.id} className={`card animate-slide-in-up stagger-${Math.min(i + 1, 6)}`} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div className="avatar avatar-md">{requester?.first_name?.[0]}{requester?.last_name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="swap-card-names" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{requester?.first_name} {requester?.last_name}</span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{offeredTo ? `${offeredTo.first_name} ${offeredTo.last_name}` : 'Open swap'}</span>
                      <span className={`badge ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>

                    {info && (
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {info.event ? format(new Date(info.event.event_datetime), 'MMM d, h:mm a') : '—'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={12} /> {info.event?.name}
                        </span>
                        {info.skill && (
                          <span className="badge badge-info">{info.skill.name}</span>
                        )}
                        {info.potentialReplacements > 0 && req.status === 'pending' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                            <Users size={12} /> {info.potentialReplacements} potential replacement(s)
                          </span>
                        )}
                      </div>
                    )}

                    {req.message && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <MessageSquare size={14} style={{ marginTop: 1, flexShrink: 0, color: 'var(--text-muted)' }} />
                        <span>{req.message}</span>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      Requested {format(new Date(req.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAccept(req.id, req.shift_id)}>
                        <CheckCircle size={14} /> Accept
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeclineId(req.id)}>
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!declineId}
        title="Decline Swap Request"
        message="Are you sure you want to decline this swap request? The volunteer will remain scheduled for their original shift."
        confirmText="Decline Request"
        onConfirm={() => {
          if (declineId) {
            handleDecline(declineId)
            setDeclineId(null)
          }
        }}
        onCancel={() => setDeclineId(null)}
      />
    </div>
  )
}
