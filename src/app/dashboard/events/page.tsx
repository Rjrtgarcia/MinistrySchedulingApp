'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format, isFuture, isPast } from 'date-fns'
import {
  Plus, Calendar, ChevronRight, Search,
  Clock, CheckCircle, X, Ban, FileText
} from 'lucide-react'
import { toast } from 'sonner'

export default function EventsPage() {
  const { events, shifts, addEvent, currentUser } = useAppStore()
  const router = useRouter()
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'completed' | 'cancelled'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '09:00', callTime: '07:30', description: '' })

  const filtered = events
    .filter(e => {
      if (timeFilter === 'upcoming') return isFuture(new Date(e.event_datetime))
      if (timeFilter === 'past') return isPast(new Date(e.event_datetime))
      return true
    })
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime())

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.date || !newEvent.time) {
      toast.error('Please provide a valid date and time')
      return
    }
    try {
      const dt = new Date(`${newEvent.date}T${newEvent.time}`)
      if (isNaN(dt.getTime())) {
        toast.error('Invalid date or time provided')
        return
      }
      const ct = newEvent.callTime ? new Date(`${newEvent.date}T${newEvent.callTime}`) : null

      addEvent({
        id: `e-${Date.now()}`, name: newEvent.name, event_datetime: dt.toISOString(),
        call_time: ct ? ct.toISOString() : null, status: 'draft', description: newEvent.description || null,
        created_by: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      toast.success(`"${newEvent.name}" created as draft`)
      setShowCreate(false)
      setNewEvent({ name: '', date: '', time: '09:00', callTime: '07:30', description: '' })
    } catch {
      toast.error('Invalid date or time provided')
    }
  }

  const statusCounts = {
    draft: events.filter(e => e.status === 'draft').length,
    published: events.filter(e => e.status === 'published').length,
    completed: events.filter(e => e.status === 'completed').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  }

  const isVolunteer = currentUser?.system_role === 'volunteer'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Manage services and events</p>
        </div>
        {!isVolunteer && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs">
          {(['upcoming', 'past', 'all'] as const).map(f => (
            <button key={f} className={`tab ${timeFilter === f ? 'tab-active' : ''}`} onClick={() => setTimeFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} />
          <input className="input" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          { key: 'all' as const, label: 'All Statuses', count: events.length },
          { key: 'draft' as const, label: 'Draft', count: statusCounts.draft },
          { key: 'published' as const, label: 'Published', count: statusCounts.published },
          { key: 'completed' as const, label: 'Completed', count: statusCounts.completed },
          { key: 'cancelled' as const, label: 'Cancelled', count: statusCounts.cancelled },
        ]).filter(s => s.key === 'all' || s.count > 0).map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`badge ${statusFilter === s.key ? 'badge-primary' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12, border: 'none', transition: 'all var(--transition-fast)' }}
          >
            {s.label} {s.count > 0 && s.key !== 'all' && <span style={{ opacity: 0.7 }}>({s.count})</span>}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={28} /></div>
            <h3 className="empty-state-title">No events found</h3>
            <p className="empty-state-text">{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first event to get started'}</p>
            {!isVolunteer && !search && statusFilter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Create Event
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((event, i) => {
            const eventShifts = shifts.filter(s => s.event_id === event.id)
            const accepted = eventShifts.filter(s => s.status === 'accepted').length
            const declined = eventShifts.filter(s => s.status === 'declined').length
            const pending = eventShifts.filter(s => s.status === 'pending').length
            const statusColors: Record<string, string> = { draft: 'badge-neutral', published: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger' }
            return (
              <div className={`card animate-slide-in-up stagger-${Math.min(i + 1, 6)}`} key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase' }}>{format(new Date(event.event_datetime), 'MMM')}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{format(new Date(event.event_datetime), 'd')}</span>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{event.name}</span>
                    <span className={`badge ${statusColors[event.status]}`}>{event.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {format(new Date(event.event_datetime), 'EEEE, MMM d')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {format(new Date(event.event_datetime), 'h:mm a')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  {eventShifts.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--success)' }}>✓ {accepted}</span>
                      <span style={{ color: 'var(--warning)' }}>◷ {pending}</span>
                      <span style={{ color: 'var(--danger)' }}>✕ {declined}</span>
                    </div>
                  )}
                  <Link href={`/dashboard/events/${event.id}`} className="btn btn-secondary btn-sm" aria-label={`View details for ${event.name}`}>
                    View Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Event</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Event Name</label>
                  <input className="input" placeholder="e.g. Sunday Worship Service" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} required />
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input type="date" className="input" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Service Time</label>
                    <input type="time" className="input" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Call Time</label>
                  <input type="time" className="input" value={newEvent.callTime} onChange={e => setNewEvent({...newEvent, callTime: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="textarea" placeholder="Optional notes..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
