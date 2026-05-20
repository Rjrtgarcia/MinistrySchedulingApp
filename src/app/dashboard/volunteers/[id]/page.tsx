'use client'

import { useAppStore } from '@/lib/store'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Phone, Calendar, Award, Clock, Heart, Users, Edit2, X, Save, CheckSquare, Square, Plus, Trash2, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { SmallGroupStatus, TrainingStatus, SystemRole } from '@/lib/types'

export default function VolunteerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { currentUser, users, skills, userSkills, shifts, events, updateUserJourney, addUserSkill, updateUserSkillStatus, removeUserSkill, updateUser } = useAppStore()

  const user = users.find(u => u.id === userId)
  const [showEditJourney, setShowEditJourney] = useState(false)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [showRemoveSkill, setShowRemoveSkill] = useState<string | null>(null)
  const [showEditRole, setShowEditRole] = useState(false)
  const [newSkillId, setNewSkillId] = useState('')
  const [newSkillStatus, setNewSkillStatus] = useState<TrainingStatus>('in_training')
  const [journeyForm, setJourneyForm] = useState({
    discipleship_one2one: user?.discipleship_one2one || false,
    discipleship_spiritual_foundation: user?.discipleship_spiritual_foundation || false,
    discipleship_leadership_113: user?.discipleship_leadership_113 || false,
    small_group_status: (user?.small_group_status || 'unknown') as SmallGroupStatus,
    small_group_leader: user?.small_group_leader || '',
  })
  const [roleForm, setRoleForm] = useState(user?.system_role || 'volunteer')

  useEffect(() => {
    if (currentUser && currentUser.system_role === 'volunteer' && currentUser.id !== userId) {
      toast.error('Access Denied: You are not authorized to view this volunteer profile.')
      router.replace('/dashboard')
    }
  }, [currentUser, userId, router])

  if (!currentUser || (currentUser.system_role === 'volunteer' && currentUser.id !== userId)) {
    return null
  }

  if (!user) return <div className="card"><div className="empty-state"><h3 className="empty-state-title">Volunteer not found</h3></div></div>

  const uSkills = userSkills.filter(us => us.user_id === userId).map(us => ({ ...us, skill: skills.find(s => s.id === us.skill_id) }))
  const userShifts = shifts.filter(s => s.user_id === userId).map(s => ({ ...s, event: events.find(e => e.id === s.event_id), skill: skills.find(sk => sk.id === s.skill_id) }))
  const assignedSkillIds = uSkills.map(us => us.skill_id)
  const availableSkills = skills.filter(s => !assignedSkillIds.includes(s.id))

  const isLeader = currentUser?.system_role === 'admin' || currentUser?.system_role === 'coordinator' || currentUser?.system_role === 'leader'

  const handleSaveJourney = (e: React.FormEvent) => {
    e.preventDefault()
    updateUserJourney(userId, journeyForm)
    toast.success('Spiritual journey updated')
    setShowEditJourney(false)
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkillId) return
    addUserSkill({
      id: `us-${Date.now()}`,
      user_id: userId,
      skill_id: newSkillId,
      training_status: newSkillStatus,
      certified_at: newSkillStatus !== 'in_training' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    })
    const skill = skills.find(s => s.id === newSkillId)
    toast.success(`${skill?.name} added`)
    setShowAddSkill(false)
    setNewSkillId('')
    setNewSkillStatus('in_training')
  }

  const handleRemoveSkill = (id: string) => {
    removeUserSkill(id)
    toast.success('Skill removed')
    setShowRemoveSkill(null)
  }

  const handleTrainingStatusChange = (id: string, status: TrainingStatus) => {
    updateUserSkillStatus(id, status)
    toast.success('Training status updated')
  }

  const handleSaveRole = () => {
    updateUser(userId, { system_role: roleForm as SystemRole })
    toast.success(`Role updated to ${roleForm}`)
    setShowEditRole(false)
  }

  const groupLabels: Record<string, string> = {
    'plugged_in': 'Plugged In',
    'seeking': 'Seeking a Group',
    'not_interested': 'Not Interested',
    'unknown': 'Unknown',
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Volunteers', href: '/dashboard/volunteers' },
        { label: `${user.first_name} ${user.last_name}` }
      ]} />

      <div className="responsive-grid-sidebar">
        {/* Profile card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="avatar avatar-xl" style={{ margin: '0 auto 16px' }}>{user.first_name[0]}{user.last_name[0]}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{user.first_name} {user.last_name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <span className={`badge ${user.system_role === 'admin' ? 'badge-danger' : user.system_role === 'coordinator' ? 'badge-primary' : user.system_role === 'leader' ? 'badge-warning' : 'badge-neutral'}`}>{user.system_role}</span>
            {isLeader && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setRoleForm(user.system_role); setShowEditRole(true) }} title="Change role">
                <Shield size={12} />
              </button>
            )}
          </div>

          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, borderTop: '1px solid var(--surface-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><Mail size={14} /> {user.email}</div>
            {user.phone_number && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><Phone size={14} /> {user.phone_number}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><Calendar size={14} /> Joined {format(new Date(user.created_at), 'MMM yyyy')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><Clock size={14} /> Prefers {user.serving_frequency_pref}x/month</div>
            {currentUser?.id === userId && (
              <Link href="/dashboard/availability" className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                <Calendar size={14} /> Manage My Availability
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Discipleship Journey */}
          <div className="card" style={{ background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={18} style={{ color: 'var(--primary-500)' }} /> Discipleship & Community
              </h3>
              {isLeader && (
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setJourneyForm({
                    discipleship_one2one: user.discipleship_one2one,
                    discipleship_spiritual_foundation: user.discipleship_spiritual_foundation,
                    discipleship_leadership_113: user.discipleship_leadership_113,
                    small_group_status: user.small_group_status,
                    small_group_leader: user.small_group_leader || '',
                  })
                  setShowEditJourney(true)
                }}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>

            <div className="responsive-grid-half">
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Discipleship Journey</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    {user.discipleship_one2one ? <CheckSquare size={16} style={{ color: 'var(--primary-500)' }} /> : <Square size={16} style={{ color: 'var(--text-muted)' }} />} Done with One2One
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    {user.discipleship_spiritual_foundation ? <CheckSquare size={16} style={{ color: 'var(--primary-500)' }} /> : <Square size={16} style={{ color: 'var(--text-muted)' }} />} Spiritual Foundation
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    {user.discipleship_leadership_113 ? <CheckSquare size={16} style={{ color: 'var(--primary-500)' }} /> : <Square size={16} style={{ color: 'var(--text-muted)' }} />} Leadership 113
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Small Group Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{groupLabels[user.small_group_status]}</div>
                  {user.small_group_status === 'plugged_in' && <span className="badge badge-success">Active</span>}
                </div>
                {user.small_group_leader && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> Leader: {user.small_group_leader}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={18} /> Skills & Training</h3>
              {isLeader && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddSkill(true)} disabled={availableSkills.length === 0}>
                  <Plus size={14} /> Add Skill
                </button>
              )}
            </div>
            {uSkills.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No skills assigned yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {uSkills.map(us => (
                  <div key={us.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{us.skill?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{us.skill?.department} Ministry</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isLeader ? (
                        <select
                          className="select"
                          style={{ width: 'auto', minWidth: 120, padding: '4px 28px 4px 8px', fontSize: 12 }}
                          value={us.training_status}
                          onChange={e => handleTrainingStatusChange(us.id, e.target.value as TrainingStatus)}
                        >
                          <option value="in_training">In Training</option>
                          <option value="qualified">Qualified</option>
                          <option value="lead">Lead</option>
                        </select>
                      ) : (
                        <span className={`badge ${us.training_status === 'qualified' ? 'badge-success' : us.training_status === 'lead' ? 'badge-primary' : 'badge-warning'}`}>
                          {us.training_status.replace('_', ' ')}
                        </span>
                      )}
                      {isLeader && (
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setShowRemoveSkill(us.id)} title="Remove skill">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shift History */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Shift History</h3>
            {userShifts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No shifts recorded</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Event</th><th>Date</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {userShifts.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.event?.name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.event ? format(new Date(s.event.event_datetime), 'MMM d, yyyy') : '—'}</td>
                        <td><span className="badge badge-info">{s.skill?.name || '—'}</span></td>
                        <td><span className={`badge ${s.status === 'accepted' ? 'badge-success' : s.status === 'declined' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Journey Modal */}
      {showEditJourney && (
        <div className="modal-backdrop" onClick={() => setShowEditJourney(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Spiritual Journey</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditJourney(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveJourney}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: 12 }}>Discipleship Journey</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={journeyForm.discipleship_one2one} onChange={e => setJourneyForm({ ...journeyForm, discipleship_one2one: e.target.checked })} />
                    Done with One2One
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={journeyForm.discipleship_spiritual_foundation} onChange={e => setJourneyForm({ ...journeyForm, discipleship_spiritual_foundation: e.target.checked })} />
                    Spiritual Foundation
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={journeyForm.discipleship_leadership_113} onChange={e => setJourneyForm({ ...journeyForm, discipleship_leadership_113: e.target.checked })} />
                    Leadership 113
                  </label>
                </div>

                <div className="input-group">
                  <label className="input-label">Small Group Status</label>
                  <select
                    className="select"
                    value={journeyForm.small_group_status}
                    onChange={e => setJourneyForm({ ...journeyForm, small_group_status: e.target.value as SmallGroupStatus })}
                  >
                    <option value="plugged_in">Plugged In</option>
                    <option value="seeking">Seeking a Group</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {journeyForm.small_group_status === 'plugged_in' && (
                  <div className="input-group animate-fade-in">
                    <label className="input-label">Small Group Leader</label>
                    <input type="text" className="input" placeholder="e.g. John Doe" value={journeyForm.small_group_leader} onChange={e => setJourneyForm({ ...journeyForm, small_group_leader: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditJourney(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="modal-backdrop" onClick={() => setShowAddSkill(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Skill</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddSkill(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSkill}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Skill</label>
                  <select className="select" value={newSkillId} onChange={e => setNewSkillId(e.target.value)} required>
                    <option value="">Select skill...</option>
                    {availableSkills.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Training Status</label>
                  <select className="select" value={newSkillStatus} onChange={e => setNewSkillStatus(e.target.value as TrainingStatus)}>
                    <option value="in_training">In Training</option>
                    <option value="qualified">Qualified</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSkill(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newSkillId}><Plus size={16} /> Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Skill Confirmation */}
      {showRemoveSkill && (
        <div className="modal-backdrop" onClick={() => setShowRemoveSkill(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Remove Skill</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRemoveSkill(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Are you sure you want to remove this skill from {user.first_name}&apos;s profile?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRemoveSkill(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleRemoveSkill(showRemoveSkill)}><Trash2 size={16} /> Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRole && (
        <div className="modal-backdrop" onClick={() => setShowEditRole(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Change Role</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditRole(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">System Role</label>
                <select className="select" value={roleForm} onChange={e => setRoleForm(e.target.value as SystemRole)}>
                  <option value="volunteer">Volunteer</option>
                  <option value="leader">Leader</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditRole(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRole}><Save size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
