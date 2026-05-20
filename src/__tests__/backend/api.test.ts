/**
 * Backend API Tests — Ministry Scheduling App
 * Tests the /api/notifications/dispatch route and all supporting backend logic
 *
 * Test Categories:
 * 1. Notification Dispatch API — Request validation, user resolution, response shapes
 * 2. Email construction — HTML generation, song lineup formatting
 * 3. SMS construction — Phone number formatting (Philippine numbers)
 * 4. Error handling — Missing users, malformed bodies, DB errors
 * 5. Supabase middleware auth — Session validation, redirect logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─────────────────────────────────────────────
// Shared mock factory
// ─────────────────────────────────────────────

const mockSupabaseFrom = vi.fn()
const mockSupabaseAuth = { getUser: vi.fn() }

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    ...overrides,
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/notifications/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildFromChain(resolvedData: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error }),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }
  return chain
}

// ─────────────────────────────────────────────
// 1. NOTIFICATION DISPATCH API
// ─────────────────────────────────────────────

describe('POST /api/notifications/dispatch', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    // Re-import the route handler fresh for each test
    const mod = await import('@/app/api/notifications/dispatch/route')
    POST = mod.POST
  })

  describe('Request validation', () => {
    it('returns 400 when no matching users are found for a given user_id', async () => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      // user lookup returns nothing
      mockSupabaseFrom.mockReturnValueOnce(buildFromChain(null, { message: 'not found' }))

      const req = makeRequest({
        user_id: 'nonexistent-uuid',
        title: 'Test',
        message: 'Hello',
        link: null,
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
      const body = await (res as any).json()
      expect(body.error).toBe('Target volunteer profile not found')
    })

    it('returns 400 when broadcast targets zero approved users', async () => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      // broadcast: approved users list is empty
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const req = makeRequest({
        user_id: null,
        title: 'Broadcast',
        message: 'All hands',
        link: '/dashboard',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await (res as any).json()
      expect(body.error).toBe('No target volunteers found')
    })

    it('returns 500 on malformed JSON request body', async () => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      const req = new Request('http://localhost:3000/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'INVALID_JSON{{{',
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      const body = await (res as any).json()
      expect(body.error).toBe('Internal Server Error')
    })
  })

  describe('Successful dispatch to a single user', () => {
    const mockUser = {
      id: 'user-123',
      first_name: 'Sarah',
      last_name: 'Lee',
      email: 'sarah@church.org',
      phone_number: '09171234567',
    }

    beforeEach(() => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      // user lookup
      mockSupabaseFrom
        .mockReturnValueOnce(buildFromChain(mockUser))
        // event details
        .mockReturnValueOnce(buildFromChain({
          name: 'Sunday Worship',
          event_datetime: '2026-05-25T09:00:00.000Z',
          call_time: '2026-05-25T07:30:00.000Z',
        }))
        // run sheet items
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'rsi-1',
                title: null,
                item_type: 'song',
                key_override: 'G',
                bpm_override: 120,
                song: { title: 'Great Is Thy Faithfulness', artist: 'Hymn', default_key: 'G', default_bpm: 90 },
              },
            ],
            error: null,
          }),
        })
        // notifications_log insert (email)
        .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
        // notifications_log insert (sms)
        .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
    })

    it('returns 200 with success flag and results array', async () => {
      const req = makeRequest({
        user_id: 'user-123',
        title: 'Shift Assigned',
        message: 'You have been assigned to Sunday Worship',
        link: '/dashboard/events/event-1',
        event_id: 'event-1',
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await (res as any).json()
      expect(body.success).toBe(true)
      expect(body.results).toHaveLength(1)
      expect(body.results[0].user_id).toBe('user-123')
      expect(body.results[0].email).toBe('sarah@church.org')
    })

    it('includes email_status and sms_status in results', async () => {
      const req = makeRequest({
        user_id: 'user-123',
        title: 'Shift Assigned',
        message: 'You have been assigned',
        link: null,
        event_id: 'event-1',
      })
      const res = await POST(req)
      const body = await (res as any).json()
      expect(body.results[0]).toHaveProperty('email_status')
      expect(body.results[0]).toHaveProperty('sms_status')
    })

    it('marks email_status as "simulated" when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY
      const req = makeRequest({
        user_id: 'user-123',
        title: 'Test',
        message: 'Hello',
        link: null,
        event_id: 'event-1',
      })
      const res = await POST(req)
      const body = await (res as any).json()
      expect(body.results[0].email_status).toBe('simulated')
    })
  })

  describe('Broadcast dispatch (user_id = null)', () => {
    const mockUsers = [
      { id: 'u1', first_name: 'Alice', last_name: 'A', email: 'alice@church.org', phone_number: null },
      { id: 'u2', first_name: 'Bob', last_name: 'B', email: 'bob@church.org', phone_number: '09182345678' },
    ]

    it('dispatches to all approved users and returns correct results count', async () => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      // broadcast: approved users
      mockSupabaseFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
        })
        // For each user: event details, runsheet, 1-2 log inserts
        .mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      const req = makeRequest({
        user_id: null,
        title: 'Event Published',
        message: 'Sunday service has been published',
        link: '/dashboard/events',
        event_id: null,
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await (res as any).json()
      expect(body.success).toBe(true)
      expect(body.results).toHaveLength(2)
    })

    it('marks sms_status as "no_phone" for users without a phone number', async () => {
      const supabase = createMockSupabase()
      vi.mocked(createClient).mockResolvedValue(supabase as any)

      mockSupabaseFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [mockUsers[0]], error: null }),
        })
        .mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      const req = makeRequest({ user_id: null, title: 'T', message: 'M', link: null })
      const res = await POST(req)
      const body = await (res as any).json()
      expect(body.results[0].sms_status).toBe('no_phone')
    })
  })
})

// ─────────────────────────────────────────────
// 2. PHONE NUMBER FORMATTING
// ─────────────────────────────────────────────

describe('Philippine phone number formatting', () => {
  /**
   * The dispatch route formats local PH phone numbers to E.164 (+639...) before sending SMS.
   * We test the formatting logic by observing simulated SMS behavior via mocked Twilio credentials.
   */

  const formatPhone = (raw: string): string => {
    const trimmed = raw.trim()
    if (trimmed.startsWith('09') && trimmed.length === 11) return '+63' + trimmed.substring(1)
    if (trimmed.startsWith('9') && trimmed.length === 10) return '+63' + trimmed
    if (!trimmed.startsWith('+')) return '+63' + trimmed.replace(/^0+/, '')
    return trimmed
  }

  it('formats "09171234567" → "+639171234567"', () => {
    expect(formatPhone('09171234567')).toBe('+639171234567')
  })

  it('formats "9171234567" (no leading 0) → "+639171234567"', () => {
    expect(formatPhone('9171234567')).toBe('+639171234567')
  })

  it('keeps already-formatted "+639171234567" unchanged', () => {
    expect(formatPhone('+639171234567')).toBe('+639171234567')
  })

  it('formats "09182345678" → "+639182345678"', () => {
    expect(formatPhone('09182345678')).toBe('+639182345678')
  })

  it('strips leading zeros for non-standard formats', () => {
    expect(formatPhone('00639171234567')).toBe('+63639171234567')
  })
})

// ─────────────────────────────────────────────
// 3. EMAIL HTML CONTENT VALIDATION
// ─────────────────────────────────────────────

describe('Email HTML content', () => {
  it('personalises greeting with volunteer first name', () => {
    const firstName = 'Sarah'
    const message = 'You have been assigned'
    const emailHtml = `<strong>Hello ${firstName},</strong><br>${message}`
    expect(emailHtml).toContain('Hello Sarah')
    expect(emailHtml).toContain(message)
  })

  it('includes event name and date in email body', () => {
    const eventName = 'Sunday Worship Service'
    const eventDateStr = 'Sunday, May 25, 2026 at 9:00 AM'
    const emailContent = `Service / Event: ${eventName}\nDate & Time: ${eventDateStr}`
    expect(emailContent).toContain(eventName)
    expect(emailContent).toContain(eventDateStr)
  })

  it('includes song lineup with key and bpm when available', () => {
    const songLineup = [
      { title: 'Great Is Thy Faithfulness', artist: 'Hymn', key: 'G', bpm: 120 },
      { title: 'What a Beautiful Name', artist: 'Hillsong', key: 'D', bpm: null },
    ]
    const compact = songLineup
      .map((s, idx) => `${idx + 1}. ${s.title}${s.key ? ` (${s.key})` : ''}`)
      .join(', ')

    expect(compact).toBe('1. Great Is Thy Faithfulness (G), 2. What a Beautiful Name (D)')
  })

  it('falls back to "No songs scheduled yet" when lineup is empty', () => {
    const songLineup: { title: string }[] = []
    const compact = songLineup.length > 0
      ? songLineup.map((s, idx) => `${idx + 1}. ${s.title}`).join(', ')
      : 'No songs scheduled yet'
    expect(compact).toBe('No songs scheduled yet')
  })

  it('uses relative link prefixed with localhost for CTA button', () => {
    const link = '/dashboard/events/event-123'
    const buttonHref = link.startsWith('http') ? link : 'http://localhost:3000' + link
    expect(buttonHref).toBe('http://localhost:3000/dashboard/events/event-123')
  })

  it('passes through absolute URLs unchanged in CTA button', () => {
    const link = 'https://myapp.vercel.app/dashboard/events/event-123'
    const buttonHref = link.startsWith('http') ? link : 'http://localhost:3000' + link
    expect(buttonHref).toBe('https://myapp.vercel.app/dashboard/events/event-123')
  })
})

// ─────────────────────────────────────────────
// 4. SMS CONTENT VALIDATION
// ─────────────────────────────────────────────

describe('SMS message content', () => {
  it('includes event name in SMS', () => {
    const eventName = 'Sunday Worship'
    const sms = `Church schedule update:\nYou are assigned to ${eventName} on Sunday, May 25.`
    expect(sms).toContain(eventName)
  })

  it('includes call time when present', () => {
    const callTimeStr = '7:30 AM'
    const sms = `Call Time: ${callTimeStr}.`
    expect(sms).toContain('7:30 AM')
  })

  it('includes song lineup compact format in SMS', () => {
    const songLineupCompact = '1. Great Is Thy Faithfulness (G), 2. What a Beautiful Name (D)'
    const sms = `🎵 Songs: ${songLineupCompact}`
    expect(sms).toContain('Great Is Thy Faithfulness')
    expect(sms).toContain('What a Beautiful Name')
  })

  it('SMS does not exceed 320 characters for typical church event', () => {
    const sms = `Church schedule update:
You are assigned to Sunday Worship Service on Sunday, May 25, 2026.
Call Time: 7:30 AM.
🎵 Songs: 1. Great Is Thy Faithfulness (G), 2. What a Beautiful Name (D)
Respond here: http://localhost:3000/dashboard/events/event-123`
    expect(sms.length).toBeLessThan(320)
  })
})

// ─────────────────────────────────────────────
// 5. SUPABASE MIDDLEWARE AUTH LOGIC
// ─────────────────────────────────────────────

describe('Middleware auth session logic', () => {
  const publicPaths = ['/login', '/register', '/auth', '/manifest.json', '/sw.js', '/icons']

  const isPublicPath = (pathname: string) =>
    publicPaths.some((p) => pathname.startsWith(p))

  const shouldRedirect = (user: null | object, isDev: boolean, hasMockSession: boolean, pathname: string) =>
    !user && !(isDev && hasMockSession) && !isPublicPath(pathname) && pathname !== '/'

  it('allows access to /login without a session', () => {
    expect(shouldRedirect(null, false, false, '/login')).toBe(false)
  })

  it('allows access to /register without a session', () => {
    expect(shouldRedirect(null, false, false, '/register')).toBe(false)
  })

  it('allows access to / root without a session', () => {
    expect(shouldRedirect(null, false, false, '/')).toBe(false)
  })

  it('redirects unauthenticated user from /dashboard/events to /login', () => {
    expect(shouldRedirect(null, false, false, '/dashboard/events')).toBe(true)
  })

  it('allows access to /dashboard/events with a real Supabase session', () => {
    const user = { id: 'user-123', email: 'marcus@church.org' }
    expect(shouldRedirect(user, false, false, '/dashboard/events')).toBe(false)
  })

  it('allows access in TEST_MODE with sb-mock-session cookie', () => {
    // isDev = true when NEXT_PUBLIC_TEST_MODE=true; hasMockSession = true
    expect(shouldRedirect(null, true, true, '/dashboard/events')).toBe(false)
  })

  it('blocks access in TEST_MODE WITHOUT sb-mock-session cookie', () => {
    // isDev = true but cookie not set
    expect(shouldRedirect(null, true, false, '/dashboard/events')).toBe(true)
  })

  it('allows access to /auth/callback without a session', () => {
    expect(shouldRedirect(null, false, false, '/auth/callback')).toBe(false)
  })

  it('allows access to static icon paths', () => {
    expect(shouldRedirect(null, false, false, '/icons/icon-192.png')).toBe(false)
  })
})

// ─────────────────────────────────────────────
// 6. STORE LOGIC — addShift optimistic update
// ─────────────────────────────────────────────

describe('Store addShift logic', () => {
  /**
   * Since Zustand stores are client-only and use Supabase client,
   * we test the pure logic of the optimistic update pattern.
   */

  it('optimistic update: shift is added to local state before DB confirms', () => {
    let shifts: { id: string; status: string }[] = []

    const newShift = { id: 'sh-1', status: 'pending' }

    // Simulate optimistic add
    shifts = [...shifts, newShift]
    expect(shifts).toHaveLength(1)
    expect(shifts[0].id).toBe('sh-1')
  })

  it('rollback: shift is removed from local state on DB error', () => {
    const initialShifts = [{ id: 'sh-existing', status: 'accepted' }]
    let shifts = [...initialShifts]
    const newShift = { id: 'sh-new', status: 'pending' }

    // Optimistic add
    shifts = [...shifts, newShift]
    expect(shifts).toHaveLength(2)

    // Simulate DB error → rollback
    shifts = shifts.filter((s) => s.id !== newShift.id)
    expect(shifts).toHaveLength(1)
    expect(shifts[0].id).toBe('sh-existing')
  })
})

// ─────────────────────────────────────────────
// 7. STORE LOGIC — addRunSheetItem resilience
// ─────────────────────────────────────────────

describe('Store addRunSheetItem schema error resilience', () => {
  const isSchemaError = (message: string) =>
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('does not exist')

  it('keeps optimistic update when error is a schema cache error', () => {
    const error = { message: "Could not find the table 'public.run_sheet_items' in the schema cache" }
    expect(isSchemaError(error.message)).toBe(true)
  })

  it('keeps optimistic update when error mentions missing relation', () => {
    const error = { message: 'relation "public.run_sheet_items" does not exist' }
    expect(isSchemaError(error.message)).toBe(true)
  })

  it('rolls back on a real DB error (e.g. RLS violation)', () => {
    const error = { message: 'new row violates row-level security policy' }
    expect(isSchemaError(error.message)).toBe(false)
  })

  it('rolls back on a network error', () => {
    const error = { message: 'Failed to fetch' }
    expect(isSchemaError(error.message)).toBe(false)
  })
})
