'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function AvailabilityPage() {
  const { currentUser, unavailabilities, addUnavailability, removeUnavailability } = useAppStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [showAdd, setShowAdd] = useState(false)
  const [newBlock, setNewBlock] = useState({ startDate: '', endDate: '', reason: '' })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = monthStart.getDay()

  const isBlocked = (date: Date) =>
    unavailabilities.some(u => {
      const start = new Date(u.start_date)
      const end = new Date(u.end_date)
      return date >= start && date <= end
    })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addUnavailability({
      id: `u-${Date.now()}`, user_id: currentUser?.id || '1',
      start_date: newBlock.startDate, end_date: newBlock.endDate,
      reason: newBlock.reason, created_at: new Date().toISOString(),
    })
    toast.success('Unavailability saved')
    setShowAdd(false)
    setNewBlock({ startDate: '', endDate: '', reason: '' })
  }

  const removeBlock = (id: string) => {
    removeUnavailability(id)
    toast.success('Availability restored')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Availability</h1><p className="page-subtitle">Block out dates when you&apos;re unavailable</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Unavailability</button>
      </div>

      <div className="availability-layout">
        {/* Calendar */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={18} /></button>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={18} /></button>
          </div>

          <div className="calendar-grid-7" style={{ gap: 2 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const blocked = isBlocked(day)
              const today = isToday(day)
              return (
                <div key={day.toISOString()} style={{
                  textAlign: 'center', padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                  background: blocked ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : today ? 'color-mix(in srgb, var(--primary-500) 12%, transparent)' : 'transparent',
                  color: blocked ? 'var(--danger)' : today ? 'var(--primary-600)' : 'var(--text-primary)',
                  fontSize: 14, fontWeight: today ? 700 : 400,
                  border: today ? '1px solid var(--primary-500)' : '1px solid transparent',
                }}>
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>
        </div>

        {/* Blocked dates list */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Blocked Dates</h3>
          {unavailabilities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No dates blocked</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unavailabilities.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{format(new Date(u.start_date), 'MMM d')} — {format(new Date(u.end_date), 'MMM d')}</div>
                    {u.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.reason}</div>}
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeBlock(u.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Block Dates</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-grid-2">
                  <div className="input-group"><label className="input-label">Start Date</label><input type="date" className="input" value={newBlock.startDate} onChange={e => setNewBlock({...newBlock, startDate: e.target.value})} required /></div>
                  <div className="input-group"><label className="input-label">End Date</label><input type="date" className="input" value={newBlock.endDate} onChange={e => setNewBlock({...newBlock, endDate: e.target.value})} required /></div>
                </div>
                <div className="input-group"><label className="input-label">Reason (optional)</label><input className="input" value={newBlock.reason} onChange={e => setNewBlock({...newBlock, reason: e.target.value})} placeholder="e.g. Vacation, family event..." /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save Unavailability</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
