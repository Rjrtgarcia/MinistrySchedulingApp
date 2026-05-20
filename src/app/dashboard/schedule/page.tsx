'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, parseISO
} from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  CalendarDays, X, Clock, Users, CheckCircle, AlertCircle, List
} from 'lucide-react'
import { toast } from 'sonner'

type ViewMode = 'month' | 'week' | 'list'

export default function SchedulePage() {
  const { currentUser, events, shifts, users, addEvent } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newEvent, setNewEvent] = useState({ name: '', time: '09:00', callTime: '07:30', description: '' })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isVolunteer = mounted ? currentUser?.system_role === 'volunteer' : false

  // Calculate visible days based on view mode
  const visibleDays = useMemo(() => {
    if (viewMode === 'month' || viewMode === 'list') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: calStart, end: calEnd })
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, viewMode])

  // Get events for visible range
  const visibleEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.event_datetime)
      const rangeStart = visibleDays[0]
      const rangeEnd = visibleDays[visibleDays.length - 1]
      return eventDate >= rangeStart && eventDate <= new Date(rangeEnd.getTime() + 86400000)
    })
  }, [events, visibleDays])

  // Get volunteer's own shifts
  const myShifts = useMemo(() => {
    if (!isVolunteer || !currentUser) return []
    return shifts.filter(s => s.user_id === currentUser.id)
  }, [shifts, currentUser, isVolunteer])

  // Navigation handlers
  const goNext = () => {
    if (viewMode === 'month' || viewMode === 'list') setCurrentDate(prev => addMonths(prev, 1))
    else setCurrentDate(prev => addWeeks(prev, 1))
  }
  const goPrev = () => {
    if (viewMode === 'month' || viewMode === 'list') setCurrentDate(prev => subMonths(prev, 1))
    else setCurrentDate(prev => subWeeks(prev, 1))
  }
  const goToday = () => setCurrentDate(new Date())

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    let dayEvents = []
    if (isVolunteer) {
      const myEventIds = myShifts.map(s => s.event_id)
      dayEvents = visibleEvents.filter(e => {
        const eventDate = new Date(e.event_datetime)
        return isSameDay(eventDate, day) && myEventIds.includes(e.id)
      })
    } else {
      dayEvents = visibleEvents.filter(e => isSameDay(new Date(e.event_datetime), day))
    }
    // Sort events by time
    return dayEvents.sort((a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime())
  }

  // Get shift info for an event
  const getShiftInfo = (eventId: string) => {
    const eventShifts = shifts.filter(s => s.event_id === eventId)
    return {
      total: eventShifts.length,
      accepted: eventShifts.filter(s => s.status === 'accepted').length,
      pending: eventShifts.filter(s => s.status === 'pending').length,
      declined: eventShifts.filter(s => s.status === 'declined').length,
    }
  }

  // Get my shift status for an event (volunteer view)
  const getMyShiftForEvent = (eventId: string) => {
    if (!currentUser) return null
    return shifts.find(s => s.event_id === eventId && s.user_id === currentUser.id)
  }

  // Status colors for event pills
  const statusGradients: Record<string, string> = {
    draft: 'var(--surface-2)',
    published: 'color-mix(in srgb, var(--primary-500) 15%, transparent)',
    completed: 'color-mix(in srgb, var(--success) 15%, transparent)',
    cancelled: 'color-mix(in srgb, var(--danger) 15%, transparent)',
  }
  const statusBorders: Record<string, string> = {
    draft: '1px solid var(--surface-border)',
    published: '1px solid color-mix(in srgb, var(--primary-500) 30%, transparent)',
    completed: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
    cancelled: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
  }

  // Quick-create handler
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !newEvent.name) return
    try {
      const dt = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.time}`)
      const ct = newEvent.callTime ? new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.callTime}`) : null
      addEvent({
        id: `e-${Date.now()}`, name: newEvent.name, event_datetime: dt.toISOString(),
        call_time: ct ? ct.toISOString() : null, status: 'draft', description: newEvent.description,
        created_by: currentUser?.id || '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      toast.success('Event created!')
      setShowCreate(false)
      setNewEvent({ name: '', time: '09:00', callTime: '07:30', description: '' })
      setSelectedDate(null)
    } catch {
      toast.error('Failed to create event')
    }
  }

  const handleDayClick = (day: Date) => {
    if (isVolunteer) return
    setSelectedDate(day)
    setShowCreate(true)
  }

  // Header text
  const headerText = viewMode === 'month' || viewMode === 'list'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(visibleDays[0], 'MMM d')} — ${format(visibleDays[6], 'MMM d, yyyy')}`

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">
            {isVolunteer ? 'Your upcoming shifts' : 'Ministry-wide calendar'}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        flexWrap: 'wrap', justifyContent: 'space-between'
      }}>
        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" onClick={goPrev} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={goToday} style={{ fontSize: 13 }}>
            Today
          </button>
          <button className="btn btn-ghost btn-icon" onClick={goNext} aria-label="Next">
            <ChevronRight size={18} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}>
            {headerText}
          </h2>
        </div>

        {/* View Toggle */}
        <div className="tabs" style={{ flexShrink: 0 }}>
          <button
            className={`tab ${viewMode === 'month' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            <CalendarIcon size={14} /> Month
          </button>
          <button
            className={`tab ${viewMode === 'week' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            <CalendarDays size={14} /> Week
          </button>
          <button
            className={`tab ${viewMode === 'list' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Event</th>
                  {!isVolunteer && <th>Roster Fill</th>}
                  <th>Status</th>
                  {isVolunteer && <th>My Shift</th>}
                </tr>
              </thead>
              <tbody>
                {visibleDays.map(day => {
                  const dayEvents = getEventsForDay(day)
                  if (dayEvents.length === 0) return null
                  const inCurrentMonth = isSameMonth(day, currentDate)
                  // In list mode (which is month-based), maybe only show current month's events
                  if (!inCurrentMonth) return null

                  return dayEvents.map((event, idx) => {
                    const info = getShiftInfo(event.id)
                    const myShift = isVolunteer ? getMyShiftForEvent(event.id) : null
                    const eventDate = new Date(event.event_datetime)

                    return (
                      <tr key={event.id} onClick={() => window.location.href = `/dashboard/events/${event.id}`} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{format(eventDate, 'MMM d, yyyy')}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(eventDate, 'h:mm a')}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{event.name}</div>
                          {event.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.description}</div>}
                        </td>
                        {!isVolunteer && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: 'var(--success)' }}>{info.accepted}</span>
                              <span style={{ color: 'var(--text-muted)' }}>/</span>
                              <span style={{ fontWeight: 600 }}>{info.total}</span>
                              {info.pending > 0 && <span className="badge badge-warning" style={{ marginLeft: 6 }}>{info.pending} pending</span>}
                            </div>
                          </td>
                        )}
                        <td>
                          <span className={`badge ${event.status === 'published' ? 'badge-primary' : event.status === 'completed' ? 'badge-success' : event.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'}`}>
                            {event.status}
                          </span>
                        </td>
                        {isVolunteer && (
                          <td>
                            {myShift && (
                              <span className={`badge ${myShift.status === 'accepted' ? 'badge-success' : myShift.status === 'declined' ? 'badge-danger' : 'badge-warning'}`}>
                                {myShift.status}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid var(--surface-border)',
            background: 'var(--surface-2)',
          }}>
            {dayNames.map(day => (
              <div key={day} style={{
                padding: '10px 8px', textAlign: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: viewMode === 'week' ? 'minmax(200px, auto)' : 'minmax(110px, auto)',
          }}>
            {visibleDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day)
              const inCurrentMonth = isSameMonth(day, currentDate)
              const today = isToday(day)

              // For month view, limit to 3 events to save space
              const maxEvents = viewMode === 'month' ? 3 : 999
              const visibleDayEvents = dayEvents.slice(0, maxEvents)
              const hiddenEventsCount = Math.max(0, dayEvents.length - maxEvents)

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  style={{
                    padding: '6px 8px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--surface-border)' : 'none',
                    borderBottom: '1px solid var(--surface-border)',
                    background: today
                      ? 'rgba(99,102,241,0.06)'
                      : !inCurrentMonth && viewMode === 'month'
                        ? 'var(--surface-1)'
                        : 'transparent',
                    cursor: isVolunteer ? 'default' : 'pointer',
                    transition: 'background var(--transition-fast)',
                    minHeight: viewMode === 'week' ? 200 : 110,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    if (!isVolunteer)
                      e.currentTarget.style.background = 'rgba(99,102,241,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = today
                      ? 'rgba(99,102,241,0.06)'
                      : !inCurrentMonth && viewMode === 'month'
                        ? 'var(--surface-1)'
                        : 'transparent'
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 4,
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: today ? 800 : 500,
                      color: today
                        ? 'white'
                        : inCurrentMonth || viewMode === 'week'
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                      background: today ? 'var(--primary-500)' : 'transparent',
                    }}>
                      {format(day, 'd')}
                    </span>
                    {!isVolunteer && (
                      <Plus size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    )}
                  </div>

                  {/* Event pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    {visibleDayEvents.map(event => {
                      const info = getShiftInfo(event.id)
                      const myShift = isVolunteer ? getMyShiftForEvent(event.id) : null

                      return (
                        <Link
                          key={event.id}
                          href={`/dashboard/events/${event.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'block',
                            padding: viewMode === 'week' ? '8px 10px' : '4px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: statusGradients[event.status] || statusGradients.draft,
                            border: statusBorders[event.status] || statusBorders.draft,
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all var(--transition-fast)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          {/* Event name (and time for month view) */}
                          <div style={{
                            fontSize: viewMode === 'week' ? 13 : 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: viewMode === 'month' ? 'flex' : 'block',
                            gap: 4,
                          }}>
                            {viewMode === 'month' && (
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {format(new Date(event.event_datetime), 'h:mm')}
                              </span>
                            )}
                            {event.name}
                          </div>

                          {/* Expanded Time (Week View only) */}
                          {viewMode === 'week' && (
                            <div style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', gap: 3,
                              marginTop: 4,
                            }}>
                              <Clock size={11} />
                              {format(new Date(event.event_datetime), 'h:mm a')}
                            </div>
                          )}

                          {/* Roster info (coordinator Week view only) */}
                          {!isVolunteer && info.total > 0 && viewMode === 'week' && (
                            <div style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              display: 'flex', alignItems: 'center', gap: 4,
                              marginTop: 6,
                            }}>
                              <Users size={11} />
                              <span style={{ color: 'var(--success)' }}>{info.accepted}</span>
                              <span style={{ color: 'var(--text-muted)' }}>/</span>
                              <span>{info.total}</span>
                              {info.pending > 0 && (
                                <span style={{ color: 'var(--warning)', marginLeft: 2 }}>
                                  ({info.pending} pending)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Volunteer shift status */}
                          {isVolunteer && myShift && viewMode === 'week' && (
                            <div style={{
                              fontSize: 12,
                              marginTop: 6,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              {myShift.status === 'accepted' && (
                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <CheckCircle size={10} /> Accepted
                                </span>
                              )}
                              {myShift.status === 'pending' && (
                                <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <AlertCircle size={10} /> Respond
                                </span>
                              )}
                              {myShift.status === 'declined' && (
                                <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <X size={10} /> Declined
                                </span>
                              )}
                            </div>
                          )}

                          {/* Expanded week view: show more details */}
                          {viewMode === 'week' && !isVolunteer && (
                            <div style={{ marginTop: 8, borderTop: '1px solid var(--surface-border)', paddingTop: 6 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {event.description || 'No description'}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <span className={`badge ${event.status === 'published' ? 'badge-primary' : event.status === 'completed' ? 'badge-success' : event.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                                  {event.status}
                                </span>
                                {event.call_time && (
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    Call: {format(new Date(event.call_time), 'h:mm a')}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Link>
                      )
                    })}

                    {/* +X more button for month view */}
                    {hiddenEventsCount > 0 && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(day);
                          setViewMode('week');
                        }}
                        style={{ 
                          fontSize: 11, fontWeight: 600, color: 'var(--primary-600)', 
                          textAlign: 'center', marginTop: 2, cursor: 'pointer',
                          padding: '2px 0'
                        }}
                      >
                        + {hiddenEventsCount} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap',
        fontSize: 12, color: 'var(--text-muted)', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
        {[
          { label: 'Draft', color: 'var(--surface-3)' },
          { label: 'Published', color: 'rgba(99,102,241,0.4)' },
          { label: 'Completed', color: 'rgba(16,185,129,0.4)' },
          { label: 'Cancelled', color: 'rgba(239,68,68,0.4)' },
        ].map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.color, border: '1px solid var(--surface-border)'
            }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Quick Create Event Modal */}
      {showCreate && selectedDate && (
        <div className="modal-backdrop" onClick={() => { setShowCreate(false); setSelectedDate(null) }}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Create Event — {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowCreate(false); setSelectedDate(null) }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Event Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Sunday Worship Service"
                    value={newEvent.name}
                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Service Time</label>
                    <input
                      type="time"
                      className="input"
                      value={newEvent.time}
                      onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Call Time</label>
                    <input
                      type="time"
                      className="input"
                      value={newEvent.callTime}
                      onChange={e => setNewEvent({ ...newEvent, callTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    className="textarea"
                    placeholder="Optional notes..."
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setSelectedDate(null) }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
