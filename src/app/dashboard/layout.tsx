'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Calendar, CalendarDays, Users, ListMusic,
  BarChart3, Settings, Menu, X, LogOut, Bell, ChevronDown,
  UserCheck, Repeat, ChevronUp, Check, CheckCheck, Moon, Sun
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarDays },
  { label: 'Events', href: '/dashboard/events', icon: Calendar },
  { label: 'Volunteers', href: '/dashboard/volunteers', icon: Users },
  { label: 'Song Library', href: '/dashboard/songs', icon: ListMusic },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

const volunteerNavItems = [
  { label: 'My Schedule', href: '/dashboard/schedule', icon: CalendarDays },
  { label: 'Availability', href: '/dashboard/availability', icon: LayoutDashboard },
  { label: 'Profile', href: '/dashboard/profile', icon: Users },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, sidebarOpen, setSidebarOpen, users, notifications, markNotificationRead, markAllNotificationsRead, swapRequests, setCurrentUser, theme, setTheme, fetchData } = useAppStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'sb-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    fetchData()
  }, [fetchData])

  // Global Escape key handler — closes any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const backdrop = document.querySelector('.modal-backdrop') as HTMLElement
        if (backdrop) backdrop.click()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pendingCount = mounted ? users.filter(u => u.approval_status === 'pending').length : 0
  const pendingSwaps = mounted ? swapRequests.filter(r => r.status === 'pending').length : 0
  const isVolunteer = mounted ? currentUser?.system_role === 'volunteer' : false
  const items = isVolunteer ? volunteerNavItems : navItems
  const unreadNotifs = mounted ? notifications.filter(n => !n.read).length : 0

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const updateScrollLock = () => {
      document.body.style.overflow = mq.matches && sidebarOpen ? 'hidden' : ''
    }
    updateScrollLock()
    mq.addEventListener('change', updateScrollLock)
    return () => {
      document.body.style.overflow = ''
      mq.removeEventListener('change', updateScrollLock)
    }
  }, [sidebarOpen])

  // All demo users for the user switcher
  const demoUserOptions = mounted ? users.filter(u => u.approval_status === 'approved') : []

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} className="hide-desktop" />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        background: 'var(--surface-1)', borderRight: '1px solid var(--surface-border)',
        display: 'flex', flexDirection: 'column', transition: 'transform var(--transition-base), visibility var(--transition-base)',
      }} className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Sidebar header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ListMusic size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Ministry</span>
          </Link>
          <button className="btn btn-ghost btn-icon hide-desktop" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {items.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`nav-link ${active ? 'active' : ''}`}
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.label === 'Volunteers' && pendingCount > 0 && (
                  <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{pendingCount}</span>
                )}
              </Link>
            )
          })}

          {!isVolunteer && (
            <>
              <div style={{ height: 1, background: 'var(--surface-border)', margin: '12px 0' }} />
              <Link href="/dashboard/volunteers/approval" onClick={() => setSidebarOpen(false)}
                className={`nav-link ${pathname.includes('approval') ? 'active' : ''}`}>
                <UserCheck size={18} /> Approval Queue
                {pendingCount > 0 && <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{pendingCount}</span>}
              </Link>
              <Link href="/dashboard/swaps" onClick={() => setSidebarOpen(false)}
                className={`nav-link ${pathname.includes('swaps') ? 'active' : ''}`}>
                <Repeat size={18} /> Swap Requests
                {pendingSwaps > 0 && <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{pendingSwaps}</span>}
              </Link>
              <Link href="/dashboard/settings" onClick={() => setSidebarOpen(false)}
                className={`nav-link ${pathname.includes('settings') ? 'active' : ''}`}>
                <Settings size={18} /> Settings
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar footer - user switcher */}
        <div style={{ padding: 12, borderTop: '1px solid var(--surface-border)' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', cursor: process.env.NODE_ENV === 'development' ? 'pointer' : 'default', transition: 'background var(--transition-fast)' }}
            onClick={process.env.NODE_ENV === 'development' ? () => setUserSwitcherOpen(!userSwitcherOpen) : undefined}
          >
            <div className="avatar avatar-sm">{currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.first_name} {currentUser?.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{currentUser?.system_role}</div>
            </div>
            {process.env.NODE_ENV === 'development' && (userSwitcherOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />)}
          </div>

          {/* User switcher dropdown */}
          {process.env.NODE_ENV === 'development' && userSwitcherOpen && (
            <div className="animate-fade-in" style={{ marginTop: 8, background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: 4, maxHeight: 240, overflowY: 'auto' }}>
              <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Switch Demo User
              </div>
              {demoUserOptions.map(u => (
                <button
                   key={u.id}
                   className="btn btn-ghost"
                   style={{
                     width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 10px', gap: 8,
                     background: currentUser?.id === u.id ? 'var(--surface-3)' : 'transparent',
                   }}
                   onClick={() => { setCurrentUser(u); setUserSwitcherOpen(false) }}
                >
                  <div className="avatar avatar-sm" style={{ width: 24, height: 24, fontSize: 10 }}>{u.first_name[0]}{u.last_name[0]}</div>
                  <span>{u.first_name} {u.last_name}</span>
                  <span className={`badge ${u.system_role === 'admin' ? 'badge-danger' : u.system_role === 'coordinator' ? 'badge-primary' : u.system_role === 'leader' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: 9, marginLeft: 'auto' }}>{u.system_role}</span>
                  {currentUser?.id === u.id && <Check size={14} style={{ color: 'var(--success)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header className="dashboard-header" style={{
          height: 'var(--topbar-height)', borderBottom: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', background: 'var(--surface-1)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button className="btn btn-ghost btn-icon hide-desktop" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme Toggle */}
            {mounted && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative' }}>
                <Bell size={18} />
                {unreadNotifs > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="notification-dropdown animate-scale-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--surface-border)' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Notifications</span>
                    {unreadNotifs > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markAllNotificationsRead()} style={{ fontSize: 12 }}>
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => { markNotificationRead(n.id); if (n.link) { window.location.href = n.link }; setNotifOpen(false) }}
                          style={{
                            padding: '12px 16px', borderBottom: '1px solid var(--surface-border)',
                            cursor: 'pointer', transition: 'background var(--transition-fast)',
                            background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,102,241,0.04)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-400)', marginTop: 5, flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{format(new Date(n.created_at), 'MMM d, h:mm a')}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost" onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ gap: 6, padding: '6px 10px' }}>
                <div className="avatar avatar-sm">{currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}</div>
                <span className="hide-mobile" style={{ fontSize: 13 }}>{currentUser?.first_name}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
                  <div className="animate-scale-in" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 200,
                    background: 'var(--surface-2)', border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-md)', padding: 4, zIndex: 50, boxShadow: 'var(--shadow-lg)',
                  }}>
                    <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.first_name} {currentUser?.last_name}</div>
                      <div>{currentUser?.email}</div>
                    </div>
                    <Link href="/dashboard/profile" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserMenuOpen(false)}>
                      <Settings size={14} /> Settings
                    </Link>
                    <button 
                      className="btn btn-ghost" 
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 10px', color: 'var(--danger)', cursor: 'pointer', border: 'none', background: 'transparent' }} 
                      onClick={handleSignOut}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-main" style={{ flex: 1, padding: 24, maxWidth: 1400 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
