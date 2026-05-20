'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import {
  Calendar, Users, Clock, TrendingUp, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Plus, Music2, Repeat, X
} from 'lucide-react'
import { format, isFuture } from 'date-fns'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { currentUser } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isVolunteer = mounted ? currentUser?.system_role === 'volunteer' : false

  if (!mounted) return <CoordinatorDashboard />
  if (isVolunteer) return <VolunteerDashboard />
  return <CoordinatorDashboard />
}

function CoordinatorDashboard() {
  const { currentUser, events, shifts, users, addEvent } = useAppStore()
  const upcomingEvents = events.filter(e => isFuture(new Date(e.event_datetime)) && e.status !== 'cancelled')
  const pendingShifts = shifts.filter(s => s.status === 'pending')
  const acceptedShifts = shifts.filter(s => s.status === 'accepted')
  const activeVolunteers = users.filter(u => u.approval_status === 'approved' && u.system_role === 'volunteer')
  const pendingApprovals = users.filter(u => u.approval_status === 'pending')
  const attendanceRate = shifts.length > 0 ? Math.round((acceptedShifts.length / shifts.length) * 100) : 0

  const [showCreate, setShowCreate] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '09:00', callTime: '07:30', description: '' })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.date || !newEvent.time) {
      toast.error('Please provide a valid date and time')
      return
    }
    try {
      const dt = new Date(`${newEvent.date}T${newEvent.time}`)
      const ct = newEvent.callTime ? new Date(`${newEvent.date}T${newEvent.callTime}`) : null
      addEvent({
        id: `e-${Date.now()}`, name: newEvent.name, event_datetime: dt.toISOString(),
        call_time: ct ? ct.toISOString() : null, status: 'draft', description: newEvent.description || null,
        created_by: currentUser?.id || '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      toast.success(`"${newEvent.name}" created!`)
      setShowCreate(false)
      setNewEvent({ name: '', date: '', time: '09:00', callTime: '07:30', description: '' })
    } catch {
      toast.error('Invalid date or time provided')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your ministry operations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} /> Quick Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: 'var(--primary-400)' },
          { label: 'Pending Responses', value: pendingShifts.length, icon: Clock, color: 'var(--warning)' },
          { label: 'Active Volunteers', value: activeVolunteers.length, icon: Users, color: 'var(--accent-400)' },
          { label: 'Response Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'var(--info)' },
        ].map((stat, i) => (
          <div key={i} className={`stat-card animate-slide-in-up stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-cards">
        {/* Upcoming Events */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Events</h2>
            <Link href="/dashboard/events" className="btn btn-ghost btn-sm">View All <ChevronRight size={14} /></Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p className="empty-state-text">No upcoming events scheduled</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.slice(0, 4).map(event => {
                const eventShifts = shifts.filter(s => s.event_id === event.id)
                const accepted = eventShifts.filter(s => s.status === 'accepted').length
                const total = eventShifts.length
                return (
                  <Link key={event.id} href={`/dashboard/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', transition: 'all var(--transition-fast)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.background = 'var(--surface-2)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.background = 'transparent' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase' }}>{format(new Date(event.event_datetime), 'MMM')}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{format(new Date(event.event_datetime), 'd')}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(event.event_datetime), 'EEEE, h:mm a')}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`badge ${accepted === total && total > 0 ? 'badge-success' : 'badge-warning'}`}>
                          {accepted}/{total}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pending Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingApprovals.length > 0 && (
              <Link href="/dashboard/volunteers/approval" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>New volunteer registrations</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            )}
            {pendingShifts.slice(0, 5).map(shift => {
              const user = users.find(u => u.id === shift.user_id)
              return (
                <div key={shift.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                  <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.first_name} {user?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Awaiting response</div>
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
              )
            })}
            {pendingApprovals.length === 0 && pendingShifts.length === 0 && (
              <div className="empty-state" style={{ padding: 24 }}>
                <CheckCircle size={24} style={{ color: 'var(--accent-400)', marginBottom: 8 }} />
                <p className="empty-state-text">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Quick Create Event</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Event Name</label>
                  <input className="input" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} required placeholder="e.g. Sunday Worship Service" />
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input type="date" className="input" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Time</label>
                    <input type="time" className="input" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function VolunteerDashboard() {
  const { currentUser, shifts, events, updateShiftStatus, addSwapRequest } = useAppStore()
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapShiftId, setSwapShiftId] = useState('')
  const [swapMessage, setSwapMessage] = useState('')

  const myShifts = shifts.filter(s => s.user_id === currentUser?.id)
  const upcomingShifts = myShifts.filter(s => {
    const event = events.find(e => e.id === s.event_id)
    return event && isFuture(new Date(event.event_datetime))
  })

  const handleAccept = (shiftId: string) => {
    updateShiftStatus(shiftId, 'accepted')
    toast.success('Shift accepted! See you there 🎉')
  }

  const handleDecline = (shiftId: string) => {
    updateShiftStatus(shiftId, 'declined')
    toast.error('Shift declined')
  }

  const handleSwapRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!swapShiftId || !currentUser) return
    addSwapRequest({
      id: `sw-${Date.now()}`,
      shift_id: swapShiftId,
      requested_by: currentUser.id,
      offered_to: null,
      status: 'pending',
      message: swapMessage || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    toast.success('Swap request submitted!')
    setShowSwapModal(false)
    setSwapShiftId('')
    setSwapMessage('')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {currentUser?.first_name}!</h1>
          <p className="page-subtitle">Your upcoming schedule</p>
        </div>
      </div>

      {upcomingShifts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={28} /></div>
            <h3 className="empty-state-title">No upcoming shifts</h3>
            <p className="empty-state-text">You have no scheduled shifts coming up. Check back later!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcomingShifts.map(shift => {
            const event = events.find(e => e.id === shift.event_id)
            if (!event) return null
            return (
              <div key={shift.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase' }}>{format(new Date(event.event_datetime), 'MMM')}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{format(new Date(event.event_datetime), 'd')}</span>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{event.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{format(new Date(event.event_datetime), 'EEEE, h:mm a')}</div>
                  {event.call_time && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Call time: {format(new Date(event.call_time), 'h:mm a')}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {shift.status === 'pending' ? (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleAccept(shift.id)}><CheckCircle size={14} /> Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDecline(shift.id)}><XCircle size={14} /> Decline</button>
                    </>
                  ) : (
                    <span className={`badge ${shift.status === 'accepted' ? 'badge-success' : shift.status === 'declined' ? 'badge-danger' : 'badge-warning'}`}>
                      {shift.status}
                    </span>
                  )}
                  {shift.status === 'accepted' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSwapShiftId(shift.id); setShowSwapModal(true) }}>
                      <Repeat size={14} /> Swap
                    </button>
                  )}
                  <Link href={`/dashboard/events/${event.id}/runsheet`} className="btn btn-secondary btn-sm">
                    <Music2 size={14} /> Run Sheet
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="modal-backdrop" onClick={() => setShowSwapModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Shift Swap</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSwapModal(false)}><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleSwapRequest}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Your coordinator will be notified about this swap request. They can reassign the shift to another volunteer.
                </p>
                <div className="input-group">
                  <label className="input-label">Reason (optional)</label>
                  <textarea className="textarea" placeholder="Why do you need to swap this shift?" value={swapMessage} onChange={e => setSwapMessage(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSwapModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Repeat size={16} /> Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
