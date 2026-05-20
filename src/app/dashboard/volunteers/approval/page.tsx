'use client'

import { useAppStore } from '@/lib/store'
import { UserCheck, UserX, Mail, Phone, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ApprovalPage() {
  const { users, approveUser, rejectUser, currentUser } = useAppStore()
  const router = useRouter()
  
  useEffect(() => {
    if (currentUser && currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator') {
      toast.error('Access Denied: You are not authorized to view the registration approval queue.')
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser || (currentUser.system_role !== 'admin' && currentUser.system_role !== 'coordinator')) {
    return null
  }
  const pending = users.filter(u => u.approval_status === 'pending')

  const handleApprove = (id: string, name: string) => {
    approveUser(id)
    toast.success(`${name} has been approved!`)
  }

  const handleReject = (id: string, name: string) => {
    rejectUser(id)
    toast.error(`${name} has been rejected`)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Approval Queue</h1><p className="page-subtitle">{pending.length} pending registration{pending.length !== 1 ? 's' : ''}</p></div>
      </div>

      {pending.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><UserCheck size={28} /></div><h3 className="empty-state-title">All caught up!</h3><p className="empty-state-text">No pending registrations to review</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map((user, i) => (
            <div key={user.id} className={`card animate-slide-in-up stagger-${Math.min(i + 1, 6)}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, flexWrap: 'wrap' }}>
              <div className="avatar avatar-md">{user.first_name[0]}{user.last_name[0]}</div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{user.first_name} {user.last_name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} /> {user.email}</span>
                  {user.phone_number && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={13} /> {user.phone_number}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> Registered {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success btn-sm" onClick={() => handleApprove(user.id, user.first_name)}>
                  <UserCheck size={14} /> Approve
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(user.id, user.first_name)}>
                  <UserX size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
