'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, ArrowLeft, CheckCircle, User, Mail, Phone, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const skillOptions = [
  { id: 's1', name: 'Audio Engineer', dept: 'technical' },
  { id: 's2', name: 'Lighting Operator', dept: 'technical' },
  { id: 's3', name: 'Visual Presentation', dept: 'technical' },
  { id: 's4', name: 'Stage Manager', dept: 'technical' },
  { id: 's5', name: 'Camera Operator', dept: 'technical' },
  { id: 's7', name: 'Worship Leader', dept: 'music' },
  { id: 's8', name: 'Vocalist', dept: 'music' },
  { id: 's9', name: 'Guitarist', dept: 'music' },
  { id: 's10', name: 'Bassist', dept: 'music' },
  { id: 's11', name: 'Drummer', dept: 'music' },
  { id: 's12', name: 'Keyboardist', dept: 'music' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', skills: [] as string[] })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleSkill = (id: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(id) ? prev.skills.filter(s => s !== id) : [...prev.skills, id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSubmitted(true)
      toast.success('Registration submitted!')
      setLoading(false)
      return
    }

    const supabase = createClient()
    
    // Generate a random password since it's a magic-link only application
    const tempPassword = Math.random().toString(36).slice(-16) + 'A1!'

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone_number: form.phone,
          interest_skills: form.skills
        }
      }
    })

    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to submit registration. Please try again.')
    } else {
      setSubmitted(true)
      toast.success('Registration submitted!')
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="animate-scale-in" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-xl)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent-400)' }}>
            <CheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Registration Submitted!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Your registration is pending approval. A coordinator will review your application and you&apos;ll receive a magic link to get started.
          </p>
          <Link href="/login" className="btn btn-primary">Back to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.3, background: 'var(--accent-500)', top: '-5%', right: '-5%' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.3, background: 'var(--primary-600)', bottom: '-10%', left: '-5%' }} />
      </div>

      <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: 24 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white' }}>
            <Music size={24} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Join the Team</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign up to volunteer with our ministry</p>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />First Name</label>
                <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
              <input type="tel" className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wrench size={12} /> Areas of Interest
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Technical Ministry</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {skillOptions.filter(s => s.dept === 'technical').map(skill => (
                  <button type="button" key={skill.id} onClick={() => toggleSkill(skill.id)}
                    className={form.skills.includes(skill.id) ? 'badge badge-primary' : 'badge badge-neutral'}
                    style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}>
                    {skill.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Music Ministry</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skillOptions.filter(s => s.dept === 'music').map(skill => (
                  <button type="button" key={skill.id} onClick={() => toggleSkill(skill.id)}
                    className={form.skills.includes(skill.id) ? 'badge badge-primary' : 'badge badge-neutral'}
                    style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}>
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
