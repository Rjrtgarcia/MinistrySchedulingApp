'use client'

import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Filter, ChevronRight, Heart } from 'lucide-react'
import { toast } from 'sonner'

export default function VolunteersPage() {
  const { users, skills, userSkills, currentUser } = useAppStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<'all' | 'technical' | 'music'>('all')

  useEffect(() => {
    if (currentUser && currentUser.system_role === 'volunteer') {
      toast.error('Access Denied: You are not authorized to view the volunteer directory.')
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.system_role === 'volunteer') {
    return null
  }

  const volunteers = users.filter(u => u.approval_status === 'approved')
    .filter(u => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
    .filter(u => {
      if (deptFilter === 'all') return true
      const uSkills = userSkills.filter(us => us.user_id === u.id)
      return uSkills.some(us => {
        const skill = skills.find(s => s.id === us.skill_id)
        return skill?.department === deptFilter
      })
    })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Volunteers</h1><p className="page-subtitle">{volunteers.length} active volunteers</p></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs">
          {(['all', 'technical', 'music'] as const).map(f => (
            <button key={f} className={`tab ${deptFilter === f ? 'tab-active' : ''}`} onClick={() => setDeptFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} />
          <input className="input" placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Skills</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {volunteers.map(user => {
              const uSkills = userSkills.filter(us => us.user_id === user.id).map(us => ({
                ...us, skill: skills.find(s => s.id === us.skill_id)
              }))
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{user.first_name[0]}{user.last_name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {user.first_name} {user.last_name}
                          {user.small_group_status === 'plugged_in' && (
                            <span title="Plugged into a small group"><Heart size={12} style={{ color: 'var(--primary-500)' }} /></span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${user.system_role === 'admin' ? 'badge-danger' : user.system_role === 'coordinator' ? 'badge-primary' : user.system_role === 'leader' ? 'badge-warning' : 'badge-neutral'}`}>{user.system_role}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {uSkills.map(us => (
                        <span key={us.id} className={`badge ${us.training_status === 'qualified' ? 'badge-success' : us.training_status === 'lead' ? 'badge-primary' : 'badge-warning'}`}>
                          {us.skill?.name}
                        </span>
                      ))}
                      {uSkills.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No skills assigned</span>}
                    </div>
                  </td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td><Link href={`/dashboard/volunteers/${user.id}`} className="btn btn-ghost btn-sm"><ChevronRight size={14} /></Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
