'use client'

import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Wrench, Users, Plus, X, Edit2, Trash2, Save, Shield, ChevronDown, ChevronUp, Palette, Monitor, Sun, Moon } from 'lucide-react'
import { ConfirmModal } from '@/components/confirm-modal'
import { toast } from 'sonner'
import type { Department, SystemRole, Skill } from '@/lib/types'

export default function SettingsPage() {
  const { skills, users, addSkill, updateSkill, deleteSkill, updateUser, theme, setTheme, currentUser } = useAppStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'skills' | 'roles' | 'appearance'>('appearance')

  // Skill management
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [editSkillId, setEditSkillId] = useState<string | null>(null)
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null)
  const [skillForm, setSkillForm] = useState({ name: '', department: 'technical' as Department, description: '' })

  useEffect(() => {
    if (currentUser && currentUser.system_role !== 'admin') {
      toast.error('Access Denied: Settings are restricted to System Administrators.')
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.system_role !== 'admin') {
    return null
  }

  // Group by department
  const technicalSkills = skills.filter(s => s.department === 'technical')
  const musicSkills = skills.filter(s => s.department === 'music')

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    addSkill({
      id: `s-${Date.now()}`, name: skillForm.name,
      department: skillForm.department, description: skillForm.description || null,
      created_at: new Date().toISOString(),
    })
    toast.success(`"${skillForm.name}" added`)
    setShowAddSkill(false)
    setSkillForm({ name: '', department: 'technical', description: '' })
  }

  const handleOpenEditSkill = (s: typeof skills[0]) => {
    setSkillForm({ name: s.name, department: s.department as Department, description: s.description || '' })
    setEditSkillId(s.id)
  }

  const handleEditSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSkillId) return
    updateSkill(editSkillId, {
      name: skillForm.name,
      department: skillForm.department,
      description: skillForm.description || null,
    })
    toast.success('Skill updated')
    setEditSkillId(null)
    setSkillForm({ name: '', department: 'technical', description: '' })
  }

  const handleDeleteSkill = (id: string) => {
    const skill = skills.find(s => s.id === id)
    deleteSkill(id)
    toast.success(`"${skill?.name}" deleted`)
    setDeleteSkillId(null)
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUser(userId, { system_role: newRole as SystemRole })
    const user = users.find(u => u.id === userId)
    toast.success(`${user?.first_name}'s role updated to ${newRole}`)
  }

  const approvedUsers = users.filter(u => u.approval_status === 'approved')



  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage skills, roles, and preferences</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${activeTab === 'appearance' ? 'tab-active' : ''}`} onClick={() => setActiveTab('appearance')}>
          <Palette size={14} /> Appearance
        </button>
        <button className={`tab ${activeTab === 'skills' ? 'tab-active' : ''}`} onClick={() => setActiveTab('skills')}>
          <Wrench size={14} /> Skill Types
        </button>
        <button className={`tab ${activeTab === 'roles' ? 'tab-active' : ''}`} onClick={() => setActiveTab('roles')}>
          <Shield size={14} /> User Roles
        </button>
      </div>

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="card animate-fade-in">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Appearance</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Customize how the application looks.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--surface-border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Theme Preference</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Choose between light and dark mode.</div>
              </div>
              <select 
                className="select" 
                style={{ width: 160 }}
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'system' | 'light' | 'dark')}
              >
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Skill Management */}
      {activeTab === 'skills' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Skill Types</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddSkill(true)}>
              <Plus size={14} /> Add Skill
            </button>
          </div>
          <SkillList items={technicalSkills} title="Technical Ministry" onOpenEdit={handleOpenEditSkill} onDelete={setDeleteSkillId} />
          <SkillList items={musicSkills} title="Music Ministry" onOpenEdit={handleOpenEditSkill} onDelete={setDeleteSkillId} />
        </div>
      )}

      {/* Role Management */}
      {activeTab === 'roles' && (
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>User Roles</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Change the system role of approved users. Admins and coordinators can manage the app.</p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Current Role</th><th>Change Role</th></tr></thead>
              <tbody>
                {approvedUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{u.first_name[0]}{u.last_name[0]}</div>
                        <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.system_role === 'admin' ? 'badge-danger' : u.system_role === 'coordinator' ? 'badge-primary' : u.system_role === 'leader' ? 'badge-warning' : 'badge-neutral'}`}>
                        {u.system_role}
                      </span>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 'auto', minWidth: 140, padding: '6px 30px 6px 10px', fontSize: 13 }}
                        value={u.system_role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="volunteer">Volunteer</option>
                        <option value="leader">Leader</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="modal-backdrop" onClick={() => setShowAddSkill(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Skill Type</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddSkill(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSkill}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Skill Name</label>
                  <input className="input" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} required placeholder="e.g. Stage Manager" />
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="select" value={skillForm.department} onChange={e => setSkillForm({ ...skillForm, department: e.target.value as Department })}>
                    <option value="technical">Technical Ministry</option>
                    <option value="music">Music Ministry</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="textarea" value={skillForm.description} onChange={e => setSkillForm({ ...skillForm, description: e.target.value })} placeholder="Brief description of the role..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSkill(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {editSkillId && (
        <div className="modal-backdrop" onClick={() => setEditSkillId(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Skill</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditSkillId(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSkillSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Skill Name</label>
                  <input className="input" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="select" value={skillForm.department} onChange={e => setSkillForm({ ...skillForm, department: e.target.value as Department })}>
                    <option value="technical">Technical Ministry</option>
                    <option value="music">Music Ministry</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="textarea" value={skillForm.description} onChange={e => setSkillForm({ ...skillForm, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditSkillId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteSkillId}
        title="Delete Skill"
        message={`Are you sure you want to delete "${skills.find(s => s.id === deleteSkillId)?.name}"? This will also remove it from all volunteers who have this skill assigned.`}
        confirmText="Delete"
        onConfirm={() => deleteSkillId && handleDeleteSkill(deleteSkillId)}
        onCancel={() => setDeleteSkillId(null)}
      />
    </div>
  )
}

interface SkillListProps {
  items: Skill[]
  title: string
  onOpenEdit: (s: Skill) => void
  onDelete: (id: string) => void
}

function SkillList({ items, title, onOpenEdit, onDelete }: SkillListProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No skills in this department</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                {s.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpenEdit(s)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(s.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
