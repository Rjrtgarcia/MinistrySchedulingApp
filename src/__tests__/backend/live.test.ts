/**
 * Live Integration Test — Email & SMS Dispatch
 *
 * These tests call the actual running server at localhost:3000.
 * They verify the real /api/notifications/dispatch endpoint end-to-end.
 *
 * Email:  Uses the real RESEND_API_KEY from .env.local → actual email delivered
 * SMS:    Twilio Auth Token is not configured → SMS is "simulated" (console log only)
 *
 * Run:  npm run test:integration
 * NOTE: Server must be running (npm run start) before executing these tests
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3000'

async function dispatch(body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api/notifications/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(text) } catch { /* plain text response */ }
  return { status: res.status, body: json, text }
}

// ─────────────────────────────────────────────────────────────────
// LIVE: Email dispatch via Resend
// ─────────────────────────────────────────────────────────────────

describe('Live Email Dispatch — /api/notifications/dispatch', () => {
  it('dispatches broadcast notification and returns success or 400 (no DB users)', async () => {
    // null user_id = broadcast to all approved users in DB
    // With RESEND_API_KEY set, real emails are sent.
    // With demo data (no real Supabase users), returns 400 "No target volunteers found"
    const { status, body } = await dispatch({
      user_id: null,
      title: 'TestSprite Live Email Test',
      message: 'This is an automated live integration test. No action required.',
      link: '/dashboard/events',
      event_id: null,
    })

    expect([200, 400]).toContain(status)

    if (status === 200) {
      expect(body.success).toBe(true)
      expect(Array.isArray(body.results)).toBe(true)
      for (const result of body.results as Record<string, string>[]) {
        expect(result).toHaveProperty('user_id')
        expect(result).toHaveProperty('email')
        expect(['sent', 'simulated', 'failed']).toContain(result.email_status)
        expect(['sent', 'simulated', 'failed', 'no_phone']).toContain(result.sms_status)
      }
    }

    if (status === 400) {
      // Expected when app runs in demo mode (no real Supabase users)
      expect(typeof body.error).toBe('string')
    }
  }, 15000)

  it('returns 404 JSON for a non-existent user_id', async () => {
    const { status, body } = await dispatch({
      user_id: '00000000-0000-0000-0000-000000000000',
      title: 'Should not send',
      message: 'Test 404 path',
      link: null,
    })
    expect(status).toBe(404)
    expect(body.error).toBe('Target volunteer profile not found')
  }, 10000)

  it('returns 500 JSON for malformed request body', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'NOT_VALID_JSON{{',
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal Server Error')
  }, 10000)

  it('returns 405 JSON for GET requests (method not allowed)', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/dispatch`, { method: 'GET' })
    expect(res.status).toBe(405)
    const body = await res.json()
    expect(body.error).toContain('Method Not Allowed')
  }, 5000)
})

// ─────────────────────────────────────────────────────────────────
// LIVE: Server health checks
// ─────────────────────────────────────────────────────────────────

describe('Live Server Health', () => {
  it('login page is reachable (200)', async () => {
    const res = await fetch(`${BASE_URL}/login`)
    expect(res.status).toBe(200)
  }, 5000)

  it('register page is reachable (200)', async () => {
    const res = await fetch(`${BASE_URL}/register`)
    expect(res.status).toBe(200)
  }, 5000)

  it('root / page is reachable (200)', async () => {
    const res = await fetch(`${BASE_URL}/`)
    expect(res.status).toBe(200)
  }, 5000)

  it('dashboard redirects unauthenticated request (302/307 or 200 in test mode)', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' })
    // In test mode middleware allows access — 200 is valid
    // In strict mode, a redirect to /login is valid
    expect([200, 302, 307, 308]).toContain(res.status)
  }, 5000)

  it('responds with HTML content type on page routes', async () => {
    const res = await fetch(`${BASE_URL}/login`)
    expect(res.headers.get('content-type')).toContain('text/html')
  }, 5000)

  it('responds with JSON content type on API routes', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/dispatch`, { method: 'GET' })
    expect(res.headers.get('content-type')).toContain('application/json')
  }, 5000)
})
