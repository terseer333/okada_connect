import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Brand'
import { RoleSwitch } from '../components/RoleSwitch'
import { AuthShell } from './Login'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'rider' | 'customer'>(
    params.get('role') === 'rider' ? 'rider' : 'customer',
  )
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    motorcycleNumber: '',
    motorcycleModel: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(name: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, string> = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role,
      }
      if (role === 'rider') {
        payload.motorcycleNumber = form.motorcycleNumber
        payload.motorcycleModel = form.motorcycleModel
      }
      const user = await register(payload)
      navigate(user.role === 'rider' ? '/rider' : '/customer')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <form className="login-card login-card-register" onSubmit={submit}>
        <div className="mobile-login-logo">
          <Logo />
        </div>
        <div className="login-title">
          <span>Your next ride starts here</span>
          <h2>Create your account</h2>
          <p>Join Okada Connect. It only takes a minute.</p>
        </div>
        <RoleSwitch role={role} onChange={setRole} />
        <label>
          <span>Full name</span>
          <div>
            <Icon name="user" />
            <input
              autoComplete="name"
              required
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Phone number</span>
          <div>
            <Icon name="phone" />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="Your phone number"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Email address</span>
          <div>
            <Icon name="mail" />
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div>
            <Icon name="shield" />
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
            />
          </div>
        </label>

        {role === 'rider' && (
          <>
            <label>
              <span>Motorcycle number (optional)</span>
              <div>
                <input
                  placeholder="e.g. LAG-123-XY"
                  value={form.motorcycleNumber}
                  onChange={(e) => setField('motorcycleNumber', e.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Motorcycle model (optional)</span>
              <div>
                <input
                  placeholder="e.g. Bajaj Boxer"
                  value={form.motorcycleModel}
                  onChange={(e) => setField('motorcycleModel', e.target.value)}
                />
              </div>
            </label>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
        <button className="submit-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'} <Icon name="arrow" size={18} />
        </button>
        <p className="signup-line">
          Already have an account? <Link to={`/login?role=${role}`}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
