import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/Icon'
import { Logo, RiderIllustration } from '../components/Brand'
import { RoleSwitch } from '../components/RoleSwitch'

/**
 * Shared two-column shell for sign in / create account.
 * Mirrors the imported Figma design's `.login-page` layout.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <Link to="/" className="login-back">
        <Icon name="arrow" size={17} /> Back to home
      </Link>
      <section className="login-art" aria-hidden="true">
        <Logo light />
        <div className="login-message">
          <span>Your city. Your ride.</span>
          <h1>
            Ride smarter.
            <br />
            Get there faster.
          </h1>
        </div>
        <RiderIllustration />
        <div className="login-perks">
          <span>
            <Icon name="location" />
            <b>Nearby riders</b>
          </span>
          <span>
            <Icon name="shield" />
            <b>Safer journeys</b>
          </span>
          <span>
            <Icon name="bolt" />
            <b>More time saved</b>
          </span>
        </div>
      </section>
      <section className="login-form-side">{children}</section>
    </main>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'rider' | 'customer'>(
    params.get('role') === 'customer' ? 'customer' : 'rider',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(user.role === 'rider' ? '/rider' : '/customer')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <form className="login-card" onSubmit={submit}>
        <div className="mobile-login-logo">
          <Logo />
        </div>
        <div className="login-title">
          <span>Welcome back</span>
          <h2>Sign in to Okada Connect</h2>
          <p>Choose how you'd like to continue.</p>
        </div>
        <RoleSwitch role={role} onChange={setRole} />
        <label>
          <span>Email address</span>
          <div>
            <Icon name="mail" />
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div>
            <Icon name="shield" />
            <input
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </label>
        <div className="form-meta">
          <label>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <span className="auth-meta-note">Fast · Safe · Reliable</span>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="submit-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'} <Icon name="arrow" size={18} />
        </button>
        <div className="secure-note">
          <span /> FAST · SAFE · RELIABLE <span />
        </div>
        <p className="signup-line">
          New to Okada Connect?{' '}
          <Link to={`/register?role=${role}`}>Create your account</Link>
        </p>
      </form>
    </AuthShell>
  )
}
