'use client'

import { useAppStore } from '@/lib/store'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft, Calendar, Clock, Users, Music2, CheckCircle,
  XCircle, AlertTriangle, X, Send, UserPlus, Copy,
  Edit2, Trash2, Ban, CheckSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/confirm-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { events, shifts, users, skills, runSheetItems, addShift, updateShiftStatus, updateEvent, deleteEvent, deleteShift, duplicateEvent, addNotification, currentUser, isLoading } = useAppStore()
  const isVolunteer = currentUser?.system_role === 'volunteer'
  const [showAssign, setShowAssign] = useState(false)
  const [assignUser, setAssignUser] = useState('')
  const [assignSkill, setAssignSkill] = useState('')
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [dupDate, setDupDate] = useState('')
  const [dupTime, setDupTime] = useState('')
  const [dupCallTime, setDupCallTime] = useState('')
  const [editForm, setEditForm] = useState({ name: '', date: '', time: '', callTime: '', description: '' })

  const event = events.find(e => e.id === eventId)
  const eventRunSheetItems = runSheetItems.filter(i => i.event_id === eventId)

  // Initialize duplicate form when event loads — using useEffect instead of state-in-render
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (event) {
      const d = new Date(event.event_datetime)
      setDupDate(format(d, 'yyyy-MM-dd'))
      setDupTime(format(d, 'HH:mm'))
      if (event.call_time) {
        setDupCallTime(format(new Date(event.call_time), 'HH:mm'))
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading && !event) {
    return <div className="card"><div className="empty-state"><h3 className="empty-state-title">Loading event details...</h3></div></div>
  }

  if (!event) return <div className="card"><div className="empty-state"><h3 className="empty-state-title">Event not found</h3></div></div>

  const handleOpenEdit = () => {
    const d = new Date(event.event_datetime)
    setEditForm({
      name: event.name,
      date: format(d, 'yyyy-MM-dd'),
      time: format(d, 'HH:mm'),
      callTime: event.call_time ? format(new Date(event.call_time), 'HH:mm') : '',
      description: event.description || '',
    })
    setShowEdit(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dt = new Date(`${editForm.date}T${editForm.time}`).toISOString()
    const ct = editForm.callTime ? new Date(`${editForm.date}T${editForm.callTime}`).toISOString() : null
    updateEvent(eventId, {
      name: editForm.name,
      event_datetime: dt,
      call_time: ct,
      description: editForm.description || null,
    })
    toast.success('Event updated!')
    setShowEdit(false)
  }

  const handleDelete = () => {
    deleteEvent(eventId)
    toast.success('Event deleted')
    router.push('/dashboard/events')
  }

  const handleCancel = () => {
    updateEvent(eventId, { status: 'cancelled' })
    addNotification({
      id: `n-${Date.now()}`, user_id: null, type: 'event_cancelled',
      title: 'Event Cancelled', message: `${event.name} has been cancelled`,
      read: false, link: `/dashboard/events/${eventId}`, created_at: new Date().toISOString(),
      event_id: eventId,
    })
    toast.success('Event cancelled')
    setShowCancelConfirm(false)
  }

  const handleComplete = () => {
    updateEvent(eventId, { status: 'completed' })
    toast.success('Event marked as completed')
  }

  const handlePublish = () => {
    updateEvent(eventId, { status: 'published' })
    addNotification({
      id: `n-${Date.now()}`, user_id: null, type: 'event_published',
      title: 'Event Published', message: `${event.name} is now published`,
      read: false, link: `/dashboard/events/${eventId}`, created_at: new Date().toISOString(),
      event_id: eventId,
    })
    toast.success('Event published!')
  }

  const handleDuplicate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dupDate || !dupTime) return
    const newDateTime = new Date(`${dupDate}T${dupTime}`).toISOString()
    const newCallDateTime = dupCallTime ? new Date(`${dupDate}T${dupCallTime}`).toISOString() : null
    
    const newId = duplicateEvent(eventId, newDateTime, newCallDateTime)
    setShowDuplicate(false)
    toast.success('Event duplicated!')
    window.location.href = `/dashboard/events/${newId}`
  }

  const eventShifts = shifts.filter(s => s.event_id === eventId).map(s => ({
    ...s,
    user: users.find(u => u.id === s.user_id),
    skill: skills.find(sk => sk.id === s.skill_id),
  }))

  const accepted = eventShifts.filter(s => s.status === 'accepted')
  const pending = eventShifts.filter(s => s.status === 'pending')
  const declined = eventShifts.filter(s => s.status === 'declined')

  const availableVolunteers = users.filter(u =>
    u.approval_status === 'approved' &&
    !eventShifts.some(s => s.user_id === u.id)
  )

  const handleAssign = () => {
    if (!assignUser || !assignSkill) return
    const user = users.find(u => u.id === assignUser)
    const skill = skills.find(s => s.id === assignSkill)
    addShift({
      id: `sh-${Date.now()}`, event_id: eventId, user_id: assignUser, skill_id: assignSkill,
      status: 'pending', soft_conflict: false, notified_at: new Date().toISOString(),
      responded_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    addNotification({
      id: `n-${Date.now()}`, user_id: assignUser, type: 'shift_assigned',
      title: 'Shift Assigned', message: `You have been assigned as ${skill?.name} for ${event.name}`,
      read: false, link: `/dashboard/events/${eventId}`, created_at: new Date().toISOString(),
      event_id: eventId,
    })
    toast.success(`${user?.first_name} assigned as ${skill?.name}`)
    setShowAssign(false)
    setAssignUser('')
    setAssignSkill('')
  }

  const handleRemoveShift = (shiftId: string) => {
    deleteShift(shiftId)
    toast.success('Volunteer removed from roster')
  }

  const statusColors: Record<string, string> = { draft: 'badge-neutral', published: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger' }

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Events', href: '/dashboard/events' },
        { label: event.name }
      ]} />

      {/* Event Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{event.name}</h1>
              <span className={`badge ${statusColors[event.status]}`}>{event.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 14, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={15} /> {format(new Date(event.event_datetime), 'EEEE, MMMM d, yyyy')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={15} /> {format(new Date(event.event_datetime), 'h:mm a')}</span>
              {event.call_time && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={15} /> Call: {format(new Date(event.call_time), 'h:mm a')}</span>}
            </div>
            {event.description && (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>{event.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isVolunteer && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={handleOpenEdit}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDuplicate(true)}>
                  <Copy size={14} /> Duplicate
                </button>
              </>
            )}
            <Link href={`/dashboard/events/${eventId}/runsheet`} className="btn btn-secondary btn-sm">
              <Music2 size={14} /> Run Sheet
              {eventRunSheetItems.length > 0 && <span className="badge badge-neutral" style={{ padding: '0 4px', fontSize: 11, marginLeft: 4 }}>{eventRunSheetItems.length}</span>}
            </Link>
            {!isVolunteer && event.status === 'draft' && (
              <button className="btn btn-primary btn-sm" onClick={handlePublish}>
                <Send size={14} /> Publish
              </button>
            )}
            {!isVolunteer && event.status === 'published' && (
              <>
                <button className="btn btn-success btn-sm" onClick={handleComplete}>
                  <CheckSquare size={14} /> Complete
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }} onClick={() => setShowCancelConfirm(true)}>
                  <Ban size={14} /> Cancel
                </button>
              </>
            )}
            {!isVolunteer && (event.status === 'draft' || event.status === 'cancelled') && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        {[
          { label: 'Accepted', value: accepted.length, color: 'var(--success)', icon: CheckCircle },
          { label: 'Pending', value: pending.length, color: 'var(--warning)', icon: Clock },
          { label: 'Declined', value: declined.length, color: 'var(--danger)', icon: XCircle },
          { label: 'Total Assigned', value: eventShifts.length, color: 'var(--primary-400)', icon: Users },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <s.icon size={20} style={{ color: s.color }} />
              <div>
                <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roster */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Roster</h2>
          {!isVolunteer && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}>
              <UserPlus size={14} /> Assign Volunteer
            </button>
          )}
        </div>

        {eventShifts.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3 className="empty-state-title">No one assigned yet</h3>
            <p className="empty-state-text">Start building your roster by assigning volunteers</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Conflict</th>
                  {!isVolunteer && <th style={{ width: 140 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {eventShifts.map(shift => (
                  <tr key={shift.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{shift.user?.first_name?.[0]}{shift.user?.last_name?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{shift.user?.first_name} {shift.user?.last_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shift.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{shift.skill?.name || 'Unassigned'}</span></td>
                    <td>
                      <span className={`badge ${shift.status === 'accepted' ? 'badge-success' : shift.status === 'declined' ? 'badge-danger' : shift.status === 'swapping' ? 'badge-info' : 'badge-warning'}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
                      {shift.soft_conflict && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 13 }}>
                          <AlertTriangle size={14} /> Conflict
                        </span>
                      )}
                    </td>
                    {!isVolunteer && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {shift.status === 'pending' && (
                            <>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => { updateShiftStatus(shift.id, 'accepted'); toast.success('Shift accepted') }} title="Accept">
                                <CheckCircle size={14} />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { updateShiftStatus(shift.id, 'declined'); toast.success('Shift declined') }} title="Decline">
                            <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveShift(shift.id)} title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="modal-backdrop" onClick={() => setShowAssign(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Assign Volunteer</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAssign(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Volunteer</label>
                <select className="select" value={assignUser} onChange={e => setAssignUser(e.target.value)}>
                  <option value="">Select volunteer...</option>
                  {availableVolunteers.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="select" value={assignSkill} onChange={e => setAssignSkill(e.target.value)}>
                  <option value="">Select role...</option>
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!assignUser || !assignSkill}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Event</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Event Name</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input type="date" className="input" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Service Time</label>
                    <input type="time" className="input" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Call Time</label>
                  <input type="time" className="input" value={editForm.callTime} onChange={e => setEditForm({ ...editForm, callTime: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="textarea" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Event Modal */}
      {showDuplicate && (
        <div className="modal-backdrop" onClick={() => setShowDuplicate(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Duplicate Event</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDuplicate(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '0 24px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
              This will create a new draft event with the exact same roster and run sheet. All duplicated shifts will be reset to &apos;pending&apos;.
            </div>
            <form onSubmit={handleDuplicate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">New Date</label>
                  <input type="date" className="input" value={dupDate} onChange={e => setDupDate(e.target.value)} required />
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Service Time</label>
                    <input type="time" className="input" value={dupTime} onChange={e => setDupTime(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Call Time</label>
                    <input type="time" className="input" value={dupCallTime} onChange={e => setDupCallTime(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDuplicate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Copy size={16} /> Duplicate Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This will also remove all assigned shifts and run sheet items. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Event"
        message="Are you sure you want to cancel this event? All assigned volunteers will be notified that the event has been cancelled."
        variant="warning"
        confirmText="Cancel Event"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  )
}
