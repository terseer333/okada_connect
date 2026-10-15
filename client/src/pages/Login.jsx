import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { RoleSwitch } from '../components/AuthLayout.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'customer' ? 'customer' : 'rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setSubmitting(true);
    try { const user = await login({ email, password }); navigate(user.role === 'rider' ? '/rider' : '/customer'); }
    catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return <AuthLayout><div className="auth-card">
    <div className="auth-card-heading"><span className="auth-card-kicker">YOUR NEXT RIDE STARTS HERE</span><h1>Welcome back</h1><p>Sign in to your Okada Connect account</p></div>
    <RoleSwitch role={role} onChange={setRole} />
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <p role="alert" className="auth-error">{error}</p>}
      <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/></svg><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></span></label>
      <label className="auth-field"><span>Password</span><span className="auth-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></svg><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /></span></label>
      <div className="auth-form-meta"><label className="auth-checkbox"><input type="checkbox" defaultChecked /> <span>Remember me</span></label><span className="auth-meta-note">Welcome back!</span></div>
      <button type="submit" disabled={submitting} className="auth-submit">{submitting ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></button>
    </form>
    <div className="auth-divider"><span>FAST · SAFE · RELIABLE</span></div>
    <p className="auth-switch-copy">New to Okada Connect? <Link to={`/register?role=${role}`}>Create your account</Link></p>
  </div></AuthLayout>;
}
