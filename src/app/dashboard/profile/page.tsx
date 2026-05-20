'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { User, Mail, Phone, Clock, Save, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { currentUser, setCurrentUser, updateUser, skills, userSkills } = useAppStore()
  const [form, setForm] = useState({
    firstName: currentUser?.first_name || '',
    lastName: currentUser?.last_name || '',
    phone: currentUser?.phone_number || '',
    frequency: currentUser?.serving_frequency_pref || 2,
  })

  const uSkills = userSkills
    .filter(us => us.user_id === currentUser?.id)
    .map(us => ({ ...us, skill: skills.find(s => s.id === us.skill_id) }))

  const handleSave = () => {
    if (currentUser) {
      const updates = {
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phone,
        serving_frequency_pref: form.frequency,
      }
      setCurrentUser({ ...currentUser, ...updates })
      updateUser(currentUser.id, updates)
      toast.success('Profile updated successfully')
    }
  }

  if (!currentUser) return null

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Profile</h1><p className="page-subtitle">Manage your personal information</p></div>
        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Changes</button>
      </div>

      <div className="responsive-grid-sidebar">
        {/* Avatar & role */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="avatar avatar-xl" style={{ margin: '0 auto 16px' }}>{form.firstName[0]}{form.lastName[0]}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{form.firstName} {form.lastName}</h2>
          <span className={`badge ${currentUser.system_role === 'admin' ? 'badge-danger' : currentUser.system_role === 'coordinator' ? 'badge-primary' : 'badge-neutral'}`}>
            {currentUser.system_role}
          </span>
          <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--surface-border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Mail size={14} /> {currentUser.email}
          </div>

          {/* Skills (read-only for volunteers) */}
          {uSkills.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--surface-border)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Your Skills</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {uSkills.map(us => (
                  <div key={us.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{us.skill?.name}</span>
                    <span className={`badge ${us.training_status === 'qualified' ? 'badge-success' : us.training_status === 'lead' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                      {us.training_status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Personal Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />First Name</label>
                <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone Number</label>
              <input type="tel" className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1234567890" />
            </div>
            <div className="input-group">
              <label className="input-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Preferred Serving Frequency</label>
              <select className="select" value={form.frequency} onChange={e => setForm({...form, frequency: parseInt(e.target.value)})}>
                <option value={1}>1 time per month</option>
                <option value={2}>2 times per month</option>
                <option value={3}>3 times per month</option>
                <option value={4}>Every week</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--primary-500) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--primary-500) 15%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Shield size={16} style={{ color: 'var(--primary-400)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Account Security</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              You sign in via Magic Link sent to <strong>{currentUser.email}</strong>. No password is stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
