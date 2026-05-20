'use client'

import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Music2, X, Edit2, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { ConfirmModal } from '@/components/confirm-modal'
import { toast } from 'sonner'

export default function SongsPage() {
  const { songs, addSong, updateSong, deleteSong, currentUser } = useAppStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterKey, setFilterKey] = useState<string>('all')
  const [filterTempo, setFilterTempo] = useState<string>('all')
  const [newSong, setNewSong] = useState({ title: '', artist: '', key: '', bpm: '', lyrics: '' })
  const [editForm, setEditForm] = useState({ title: '', artist: '', key: '', bpm: '', lyrics: '' })

  useEffect(() => {
    if (currentUser && currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator' && currentUser.system_role !== 'leader') {
      toast.error('Access Denied: The Song Library is restricted to leaders and coordinators.')
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser || (currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator' && currentUser.system_role !== 'leader')) {
    return null
  }

  const filtered = songs.filter(s => {
    const matchesSearch = `${s.title} ${s.artist}`.toLowerCase().includes(search.toLowerCase())
    const matchesKey = filterKey === 'all' || s.default_key === filterKey
    let matchesTempo = true
    if (filterTempo !== 'all' && s.default_bpm) {
      if (filterTempo === 'fast') matchesTempo = s.default_bpm > 110
      else if (filterTempo === 'medium') matchesTempo = s.default_bpm >= 80 && s.default_bpm <= 110
      else if (filterTempo === 'slow') matchesTempo = s.default_bpm < 80
    }
    return matchesSearch && matchesKey && matchesTempo
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addSong({
      id: `sg-${Date.now()}`, title: newSong.title, artist: newSong.artist || null,
      default_key: newSong.key || null, default_bpm: newSong.bpm ? parseInt(newSong.bpm) : null,
      lyrics: newSong.lyrics || null, created_by: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    toast.success(`"${newSong.title}" added to song library`)
    setShowAdd(false)
    setNewSong({ title: '', artist: '', key: '', bpm: '', lyrics: '' })
  }

  const handleOpenEdit = (song: typeof songs[0]) => {
    setEditForm({
      title: song.title,
      artist: song.artist || '',
      key: song.default_key || '',
      bpm: song.default_bpm?.toString() || '',
      lyrics: song.lyrics || '',
    })
    setEditId(song.id)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    updateSong(editId, {
      title: editForm.title,
      artist: editForm.artist || null,
      default_key: editForm.key || null,
      default_bpm: editForm.bpm ? parseInt(editForm.bpm) : null,
      lyrics: editForm.lyrics || null,
    })
    toast.success('Song updated')
    setEditId(null)
  }

  const handleDelete = (id: string) => {
    const song = songs.find(s => s.id === id)
    deleteSong(id)
    toast.success(`"${song?.title}" removed from library`)
    setShowDeleteConfirm(null)
  }



  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Song Library</h1><p className="page-subtitle">{songs.length} songs</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Song</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: 400, flex: 1 }}>
          <Search size={16} />
          <input className="input" placeholder="Search songs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 120 }} value={filterKey} onChange={e => setFilterKey(e.target.value)}>
          <option value="all">Any Key</option>
          {['A','Bb','B','C','C#','D','Eb','E','F','F#','G','Ab'].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="select" style={{ width: 140 }} value={filterTempo} onChange={e => setFilterTempo(e.target.value)}>
          <option value="all">Any Tempo</option>
          <option value="fast">Fast {'>'} 110</option>
          <option value="medium">Medium 80-110</option>
          <option value="slow">Slow {'<'} 80</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(song => (
          <div key={song.id} className="card" style={{ padding: 0 }}>
            {/* Song header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', flexShrink: 0 }}>
                <Music2 size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{song.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{song.artist || 'Unknown Artist'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {song.default_key && <span className="badge badge-primary">{song.default_key}</span>}
                {song.default_bpm && <span className="badge badge-neutral">{song.default_bpm} BPM</span>}
                {song.lyrics && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expandedId === song.id ? null : song.id)} title="Toggle lyrics">
                    {expandedId === song.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <FileText size={14} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(song)} title="Edit song"><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setShowDeleteConfirm(song.id)} title="Delete song"><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Expanded lyrics */}
            {expandedId === song.id && song.lyrics && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--surface-border)' }}>
                <div style={{ marginTop: 12, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                  {song.lyrics}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Music2 size={28} /></div>
              <h3 className="empty-state-title">No songs found</h3>
              <p className="empty-state-text">{search ? 'Try a different search term' : 'Add your first song to the library'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Song Modal */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Song</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SongFormFields form={newSong} setForm={setNewSong} includeLyrics />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Song</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      {editId && (
        <div className="modal-backdrop" onClick={() => setEditId(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Song</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditId(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SongFormFields form={editForm} setForm={setEditForm} includeLyrics />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        title="Delete Song"
        message={`Are you sure you want to delete "${songs.find(s => s.id === showDeleteConfirm)?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </div>
  )
}

interface SongFormFieldsProps {
  form: {
    title: string
    artist: string
    key: string
    bpm: string
    lyrics: string
  }
  setForm: (f: {
    title: string
    artist: string
    key: string
    bpm: string
    lyrics: string
  }) => void
  includeLyrics?: boolean
}

function SongFormFields({ form, setForm, includeLyrics = false }: SongFormFieldsProps) {
  return (
    <>
      <div className="input-group">
        <label className="input-label">Title</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Goodness of God" />
      </div>
      <div className="input-group">
        <label className="input-label">Artist</label>
        <input className="input" value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="e.g. Bethel Music" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label">Default Key</label>
          <select className="select" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })}>
            <option value="">—</option>
            {['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Default BPM</label>
          <input type="number" className="input" value={form.bpm} onChange={e => setForm({ ...form, bpm: e.target.value })} placeholder="e.g. 72" />
        </div>
      </div>
      {includeLyrics && (
        <div className="input-group">
          <label className="input-label">
            <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
            Lyrics
          </label>
          <textarea className="textarea" style={{ minHeight: 120 }} value={form.lyrics} onChange={e => setForm({ ...form, lyrics: e.target.value })} placeholder="Paste song lyrics here..." />
        </div>
      )}
    </>
  )
}
