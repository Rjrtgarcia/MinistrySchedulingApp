'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Sparkles, ArrowRight, Mail } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User, SystemRole, ApprovalStatus } from '@/lib/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setCurrentUser, users } = useAppStore()

  const handleDevBypass = (targetEmail: string) => {
    const user = users.find(u => u.email === targetEmail)
    if (user) {
      document.cookie = 'sb-mock-session=true; path=/; max-age=86400'
      setCurrentUser(user)
      toast.success(`Dev Bypass: Signed in as ${user.first_name} (${user.system_role})`)
      router.push('/dashboard')
    } else {
      // Fallback: if data is loading or missing from hydration, seed a dummy user
      document.cookie = 'sb-mock-session=true; path=/; max-age=86400'
      const dummyUser: User = {
        id: 'u-dev',
        first_name: targetEmail.includes('marcus') ? 'Marcus' : targetEmail.includes('sarah') ? 'Sarah' : 'Emily',
        last_name: targetEmail.includes('marcus') ? 'Admin' : targetEmail.includes('sarah') ? 'Coordinator' : 'Torres',
        email: targetEmail,
        phone_number: null,
        system_role: (targetEmail.includes('marcus') ? 'admin' : targetEmail.includes('sarah') ? 'coordinator' : 'volunteer') as SystemRole,
        approval_status: 'approved' as ApprovalStatus,
        serving_frequency_pref: 4,
        avatar_url: null,
        discipleship_one2one: true,
        discipleship_spiritual_foundation: true,
        discipleship_leadership_113: true,
        small_group_status: 'plugged_in' as const,
        small_group_leader: 'John Doe',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCurrentUser(dummyUser)
      toast.success(`Dev Bypass: Signed in as ${dummyUser.first_name} (${dummyUser.system_role})`)
      router.push('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    })

    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to send magic link. Please try again.')
    } else {
      setSent(true)
      toast.success('Magic link sent!')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, background: 'var(--primary-600)', top: '-10%', left: '-5%' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, background: '#8b5cf6', bottom: '-5%', right: '-5%' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.3, background: 'var(--accent-500)', top: '50%', left: '60%' }} />
      </div>

      <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', boxShadow: 'var(--shadow-glow)' }}>
            <Music size={28} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ministry Scheduler</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Coordinating worship teams with clarity</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 32 }}>
          {!sent ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign in with your magic link — no password needed</p>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label htmlFor="login-email" className="input-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="login-email" type="email" className="input" placeholder="you@church.org" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 40 }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> : <><span>Send Magic Link</span><Sparkles size={16} /></>}
                </button>
              </form>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
                <span>or</span>
                <span style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
              </div>
              <Link href="/register" className="btn btn-secondary" style={{ width: '100%' }}>
                Join as a new volunteer <ArrowRight size={16} />
              </Link>
              {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true') && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--surface-border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: 8, letterSpacing: '0.05em', textAlign: 'left' }}>
                    🛠️ Staging Rate-Limit Bypass
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button type="button" onClick={() => handleDevBypass('marcus@church.org')} className="btn btn-ghost" style={{ width: '100%', fontSize: 12, justifyContent: 'flex-start', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                      🔑 Admin Role (Marcus)
                    </button>
                    <button type="button" onClick={() => handleDevBypass('sarah@church.org')} className="btn btn-ghost" style={{ width: '100%', fontSize: 12, justifyContent: 'flex-start', padding: '6px 12px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-300)' }}>
                      🔑 Coordinator Role (Sarah)
                    </button>
                    <button type="button" onClick={() => handleDevBypass('emily@church.org')} className="btn btn-ghost" style={{ width: '100%', fontSize: 12, justifyContent: 'flex-start', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                      🔑 Volunteer Role (Emily)
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="animate-scale-in" style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary-400)' }}>
                <Mail size={32} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>We sent a magic link to <strong>{email}</strong></p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, padding: '8px 16px', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-full)', fontSize: 12, color: 'var(--primary-300)' }}>
                <Sparkles size={14} /><span>Click the link in the email to sign in instantly.</span>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>Ministry Scheduler — Built for worship teams</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
