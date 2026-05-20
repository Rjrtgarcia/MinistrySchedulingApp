'use client'

import { useAppStore } from '@/lib/store'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Clock, Music2, MessageSquare, Video, Mic, Share2, Plus, ArrowLeft,
  ChevronDown, ChevronUp, Trash2, FileText, Upload, Printer, ArrowRightLeft, Megaphone, BookOpen, MoreHorizontal
} from 'lucide-react'
import type { RunSheetItem, RunSheetItemType } from '@/lib/types'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/confirm-modal'

const itemTypeConfig: Record<RunSheetItemType, { icon: typeof Music2; color: string; label: string }> = {
  song: { icon: Music2, color: '#6366f1', label: 'Song' },
  sermon: { icon: Mic, color: '#f59e0b', label: 'Sermon' },
  video: { icon: Video, color: '#3b82f6', label: 'Video' },
  transition: { icon: ArrowRightLeft, color: '#8b5cf6', label: 'Transition' },
  announcement: { icon: Megaphone, color: '#10b981', label: 'Announcement' },
  prayer: { icon: BookOpen, color: '#ec4899', label: 'Prayer' },
  other: { icon: MoreHorizontal, color: '#6b7280', label: 'Other' },
}

function SortableItem({ item, onUpdate, onRemove, songs, readOnly }: {
  item: RunSheetItem
  onUpdate: (id: string, data: Partial<RunSheetItem>) => void
  onRemove: (id: string) => void
  songs: { id: string; title: string; artist: string | null; default_key: string | null; default_bpm: number | null }[]
  readOnly: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: readOnly })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 100 : 'auto' as const }
  const config = itemTypeConfig[item.item_type]
  const Icon = config.icon

  return (
    <div ref={setNodeRef} style={{ ...style, marginBottom: 6 }}>
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${config.color}`,
        transition: 'border-color var(--transition-fast)',
      }}>
        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          {!readOnly ? (
            <button {...attributes} {...listeners} className="drag-handle hide-print" style={{ background: 'none', border: 'none', padding: 4, cursor: 'grab' }}>
              <GripVertical size={16} />
            </button>
          ) : (
            <div style={{ padding: 4, opacity: 0.5 }} className="hide-print">
              <span style={{ display: 'inline-block', width: 16 }} />
            </div>
          )}

          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color, flexShrink: 0 }}>
            <Icon size={14} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={item.title || ''}
              onChange={e => !readOnly && onUpdate(item.id, { title: e.target.value })}
              placeholder={readOnly ? 'Untitled Item' : `${config.label} title...`}
              readOnly={readOnly}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, width: '100%', outline: 'none' }}
            />
          </div>

          {item.item_type === 'song' && item.key_override && (
            <span className="badge badge-primary">{item.key_override}</span>
          )}
          {item.item_type === 'song' && item.bpm_override && (
            <span className="badge badge-neutral">{item.bpm_override} BPM</span>
          )}
          {item.duration_minutes && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-muted)' }}>
              <Clock size={12} /> {item.duration_minutes}m
            </span>
          )}

          <button className="btn btn-ghost btn-icon btn-sm hide-print" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!readOnly && (
            <button className="btn btn-ghost btn-icon btn-sm hide-print" onClick={() => onRemove(item.id)} style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ padding: '0 12px 12px', paddingLeft: 56, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--surface-border)', paddingTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {item.item_type === 'song' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Song</label>
                    <select className="select" disabled={readOnly} value={item.song_id || ''} onChange={e => {
                      const song = songs.find(s => s.id === e.target.value)
                      onUpdate(item.id, {
                        song_id: e.target.value || null,
                        title: song?.title || item.title,
                        key_override: song?.default_key || item.key_override,
                        bpm_override: song?.default_bpm || item.bpm_override,
                      })
                    }}>
                      <option value="">Custom song...</option>
                      {songs.map(s => <option key={s.id} value={s.id}>{s.title} — {s.artist}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Key</label>
                    <select className="select" disabled={readOnly} value={item.key_override || ''} onChange={e => onUpdate(item.id, { key_override: e.target.value })}>
                      <option value="">—</option>
                      {['A','Bb','B','C','C#','D','Eb','E','F','F#','G','Ab'].map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">BPM</label>
                    <input type="number" className="input" readOnly={readOnly} value={item.bpm_override || ''} onChange={e => onUpdate(item.id, { bpm_override: parseInt(e.target.value) || null })} placeholder="—" />
                  </div>
                </>
              )}
              <div className="input-group">
                <label className="input-label">Duration (min)</label>
                <input type="number" className="input" readOnly={readOnly} value={item.duration_minutes || ''} onChange={e => onUpdate(item.id, { duration_minutes: parseInt(e.target.value) || null })} placeholder="—" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label"><FileText size={11} style={{ display: 'inline', marginRight: 4 }} />Tech Cues</label>
              <textarea className="textarea" readOnly={readOnly} style={{ minHeight: 50 }} value={item.tech_cues || ''} onChange={e => onUpdate(item.id, { tech_cues: e.target.value })} placeholder={readOnly ? "—" : "Lighting, audio, visual cues..."} />
            </div>
            <div className="input-group">
              <label className="input-label">Stage Notes</label>
              <textarea className="textarea" readOnly={readOnly} style={{ minHeight: 50 }} value={item.stage_notes || ''} onChange={e => onUpdate(item.id, { stage_notes: e.target.value })} placeholder={readOnly ? "—" : "Stage transitions, positions..."} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!readOnly && (
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info('File uploads coming soon — connect Supabase Storage to enable')}><Upload size={13} /> Attach File</button>
              )}
              {item.resources && item.resources.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.resources.length} file(s) attached</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RunSheetPage() {
  const params = useParams()
  const eventId = params.id as string
  const { events, runSheetItems, songs, updateRunSheetItem, removeRunSheetItem, reorderRunSheetItems, addRunSheetItem, currentUser, isLoading } = useAppStore()
  const isVolunteer = currentUser?.system_role === 'volunteer'

  const event = events.find(e => e.id === eventId)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  
  const items = useMemo(() =>
    runSheetItems.filter(i => i.event_id === eventId).sort((a, b) => a.order_index - b.order_index),
    [runSheetItems, eventId]
  )

  const totalDuration = items.reduce((sum, i) => sum + (i.duration_minutes || 0), 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    if (isVolunteer) return
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      reorderRunSheetItems(eventId, newItems)
    }
  }

  const addItem = (type: RunSheetItemType) => {
    if (isVolunteer) return
    addRunSheetItem({
      // eslint-disable-next-line react-hooks/purity
      id: `rs-${Date.now()}`, event_id: eventId, order_index: items.length,
      item_type: type, song_id: null, title: '', duration_minutes: type === 'song' ? 5 : type === 'sermon' ? 30 : 3,
      tech_cues: null, stage_notes: null, key_override: null, bpm_override: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
  }

  if (isLoading && !event) {
    return <div className="card"><div className="empty-state"><h3 className="empty-state-title">Loading run sheet...</h3></div></div>
  }

  if (!event) return <div className="card"><div className="empty-state"><h3 className="empty-state-title">Event not found</h3></div></div>

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Events', href: '/dashboard/events' },
        { label: event.name, href: `/dashboard/events/${eventId}` },
        { label: 'Run Sheet' }
      ]} />

      <div className="page-header hide-print">
        <div>
          <h1 className="page-title">Run Sheet</h1>
          <p className="page-subtitle">{event.name} — Total: {totalDuration} min</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </button>
      </div>

      {/* Add item buttons */}
      {!isVolunteer && (
        <div className="hide-print" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(Object.entries(itemTypeConfig) as [RunSheetItemType, typeof itemTypeConfig[RunSheetItemType]][]).map(([type, cfg]) => (
            <button key={type} className="btn btn-secondary btn-sm" onClick={() => addItem(type)}
              style={{ borderColor: `${cfg.color}40` }}>
              <cfg.icon size={13} style={{ color: cfg.color }} /> {cfg.label}
            </button>
          ))}
        </div>
      )}

      {/* Sortable run sheet */}
      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Music2 size={28} /></div>
            <h3 className="empty-state-title">Empty Run Sheet</h3>
            <p className="empty-state-text">Add items using the buttons above to build your order of service</p>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <SortableItem
                key={item.id}
                item={item}
                onUpdate={updateRunSheetItem}
                onRemove={(id) => setDeleteItemId(id)}
                songs={songs}
                readOnly={isVolunteer}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <ConfirmModal
        isOpen={!!deleteItemId}
        title="Remove Item"
        message="Are you sure you want to remove this item from the run sheet?"
        confirmText="Remove"
        onConfirm={() => {
          if (deleteItemId) {
            removeRunSheetItem(deleteItemId)
            setDeleteItemId(null)
          }
        }}
        onCancel={() => setDeleteItemId(null)}
      />
    </div>
  )
}
