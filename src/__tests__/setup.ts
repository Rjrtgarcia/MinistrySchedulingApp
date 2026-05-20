// Global test setup for backend tests
import { vi } from 'vitest'

// A real Response subclass with a writable status + convenience json() method
class MockResponse {
  status: number
  private _body: unknown

  constructor(data: unknown, init?: { status?: number }) {
    this._body = data
    this.status = init?.status ?? 200
  }

  async json() {
    return this._body
  }
}

// Mock Next.js server utilities
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => new MockResponse(data, init),
    next: () => new MockResponse(null),
    redirect: (url: URL) => new MockResponse({ url: url.toString() }, { status: 302 }),
  },
}))

// Suppress console output during tests (keep errors visible)
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
