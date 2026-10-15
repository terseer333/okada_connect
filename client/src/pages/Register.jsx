import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { RoleSwitch } from '../components/AuthLayout.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'rider' ? 'rider' : 'customer');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', motorcycleNumber: '', motorcycleModel: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }
  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      const payload = { name: form.name, phone: form.phone, email: form.email, password: form.password, role };
      if (role === 'rider') { payload.motorcycleNumber = form.motorcycleNumber; payload.motorcycleModel = form.motorcycleModel; }
      const user = await register(payload); navigate(user.role === 'rider' ? '/rider' : '/customer');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  return <AuthLayout><div className="auth-card auth-card-register">
    <div className="auth-card-heading"><span className="auth-card-kicker">YOUR NEXT RIDE STARTS HERE</span><h1>Create your account</h1><p>Join Okada Connect. It only takes a minute.</p></div>
    <RoleSwitch role={role} onChange={setRole} />
    <form onSubmit={handleSubmit} className="auth-form auth-form-register">
      {error && <p role="alert" className="auth-error">{error}</p>}
      <label className="auth-field"><span>Full name</span><span className="auth-input-wrap"><input autoComplete="name" required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your full name" /></span></label>
      <label className="auth-field"><span>Phone number</span><span className="auth-input-wrap"><input type="tel" autoComplete="tel" inputMode="tel" required value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="Your phone number" /></span></label>
      <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><input type="email" autoComplete="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com" /></span></label>
      <label className="auth-field"><span>Password</span><span className="auth-input-wrap"><input type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="At least 8 characters" /></span></label>
      {role === 'rider' && <div className="auth-rider-fields"><label className="auth-field"><span>Motorcycle number <small>Optional</small></span><span className="auth-input-wrap"><input value={form.motorcycleNumber} onChange={(e) => setField('motorcycleNumber', e.target.value)} placeholder="e.g. LAG-123-XY" /></span></label><label className="auth-field"><span>Motorcycle model <small>Optional</small></span><span className="auth-input-wrap"><input value={form.motorcycleModel} onChange={(e) => setField('motorcycleModel', e.target.value)} placeholder="e.g. Bajaj Boxer" /></span></label></div>}
      <button type="submit" disabled={submitting} className="auth-submit">{submitting ? 'Creating account…' : 'Create account'}<span aria-hidden="true">→</span></button>
    </form>
    <p className="auth-switch-copy">Already have an account? <Link to={`/login?role=${role}`}>Sign in</Link></p>
  </div></AuthLayout>;
}
