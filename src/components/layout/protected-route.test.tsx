import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GuestRoute, ProtectedRoute } from '@/components/layout/protected-route'

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuth,
}))

let mockAuth = {
  user: null as null | { onboardingCompleted: boolean },
  loading: false,
}

describe('auth guards', () => {
  it('redirects guests away from protected routes', () => {
    mockAuth = { user: null, loading: false }
    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<div>secret</div>} />
          </Route>
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it('sends authenticated users away from guest routes', () => {
    mockAuth = { user: { onboardingCompleted: true }, loading: false }
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>login</div>} />
          </Route>
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})
