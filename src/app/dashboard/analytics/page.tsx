'use client'

import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Users, TrendingUp, Award, CheckCircle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AnalyticsPage() {
  const { users, shifts, events, skills, userSkills, currentUser } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (currentUser && currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator' && currentUser.system_role !== 'leader') {
      toast.error('Access Denied: Analytics are restricted to leaders and coordinators.')
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser || (currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator' && currentUser.system_role !== 'leader')) {
    return null
  }

  const approved = users.filter(u => u.approval_status === 'approved' && u.system_role === 'volunteer')
  const totalShifts = shifts.length
  const acceptedShifts = shifts.filter(s => s.status === 'accepted').length
  const declinedShifts = shifts.filter(s => s.status === 'declined').length
  const responseRate = totalShifts > 0 ? Math.round(((acceptedShifts + declinedShifts) / totalShifts) * 100) : 0
  const acceptRate = totalShifts > 0 ? Math.round((acceptedShifts / totalShifts) * 100) : 0

  const qualified = userSkills.filter(us => us.training_status === 'qualified' || us.training_status === 'lead').length
  const inTraining = userSkills.filter(us => us.training_status === 'in_training').length

  // Skill distribution
  const skillCounts = skills.map(skill => ({
    skill,
    count: userSkills.filter(us => us.skill_id === skill.id).length,
    qualified: userSkills.filter(us => us.skill_id === skill.id && (us.training_status === 'qualified' || us.training_status === 'lead')).length,
  })).sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...skillCounts.map(s => s.count), 1)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Ministry performance overview</p></div>
      </div>

      {/* Top Stats */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Active Volunteers', value: approved.length, icon: Users, color: 'var(--primary-400)' },
          { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: 'var(--accent-400)' },
          { label: 'Accept Rate', value: `${acceptRate}%`, icon: CheckCircle, color: 'var(--success)' },
          { label: 'Certified Skills', value: qualified, icon: Award, color: 'var(--warning)' },
        ].map((stat, i) => (
          <div key={i} className={`stat-card animate-slide-in-up stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="responsive-grid-half">
        {/* Shift Response Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Shift Responses</h3>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            {[
              { label: 'Accepted', value: acceptedShifts, color: 'var(--success)', icon: CheckCircle },
              { label: 'Pending', value: shifts.filter(s => s.status === 'pending').length, color: 'var(--warning)', icon: Clock },
              { label: 'Declined', value: declinedShifts, color: 'var(--danger)', icon: XCircle },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <item.icon size={20} style={{ color: item.color, marginBottom: 4 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--surface-3)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${acceptRate}%`, background: 'var(--success)', transition: 'width 0.5s ease' }} />
            <div style={{ width: `${totalShifts > 0 ? Math.round((shifts.filter(s => s.status === 'pending').length / totalShifts) * 100) : 0}%`, background: 'var(--warning)' }} />
            <div style={{ width: `${totalShifts > 0 ? Math.round((declinedShifts / totalShifts) * 100) : 0}%`, background: 'var(--danger)' }} />
          </div>
        </div>

        {/* Training Readiness */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Training & Readiness</h3>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--success)' }}>{qualified}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qualified</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--warning)' }}>{inTraining}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>In Training</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--surface-3)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(qualified + inTraining) > 0 ? Math.round((qualified / (qualified + inTraining)) * 100) : 0}%`, background: 'var(--success)', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {(qualified + inTraining) > 0 ? Math.round((qualified / (qualified + inTraining)) * 100) : 0}% workforce certified
          </div>
        </div>
      </div>

      {/* Skill Distribution */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skill Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {skillCounts.map(({ skill, count, qualified: q }) => (
            <div key={skill.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{skill.name}</span>
                  <span className={`badge ${skill.department === 'technical' ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: 10 }}>{skill.department}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q}/{count} qualified</span>
              </div>
              <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{
                  width: `${(count / maxCount) * 100}%`,
                  height: '100%',
                  background: skill.department === 'technical' ? 'var(--info)' : 'var(--primary-400)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
