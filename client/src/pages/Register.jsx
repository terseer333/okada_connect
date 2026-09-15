import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    motorcycleNumber: '',
    motorcycleModel: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role,
      };
      if (role === 'rider') {
        payload.motorcycleNumber = form.motorcycleNumber;
        payload.motorcycleModel = form.motorcycleModel;
      }
      const user = await register(payload);
      navigate(user.role === 'rider' ? '/rider' : '/customer');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-okada focus:outline-none';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="text-center">
        <div className="text-4xl" aria-hidden>🏍️</div>
        <h1 className="mt-2 text-2xl font-bold">Create account</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            I am registering as:
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`rounded-lg border-2 px-4 py-3 font-medium ${
                role === 'customer'
                  ? 'border-okada bg-green-50 text-okada'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              👤 Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('rider')}
              className={`rounded-lg border-2 px-4 py-3 font-medium ${
                role === 'rider'
                  ? 'border-okada bg-green-50 text-okada'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              🏍️ Okada Rider
            </button>
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className={inputClass}
            placeholder="Chidi Okafor"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            className={inputClass}
            placeholder="08012345678"
            inputMode="tel"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>

        {role === 'rider' && (
          <>
            <div>
              <label
                htmlFor="motorcycleNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Motorcycle number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="motorcycleNumber"
                value={form.motorcycleNumber}
                onChange={(e) => setField('motorcycleNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. LAG-123-XY"
              />
            </div>
            <div>
              <label
                htmlFor="motorcycleModel"
                className="block text-sm font-medium text-gray-700"
              >
                Motorcycle model <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="motorcycleModel"
                value={form.motorcycleModel}
                onChange={(e) => setField('motorcycleModel', e.target.value)}
                className={inputClass}
                placeholder="e.g. Bajaj Boxer"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-okada px-6 py-3 font-semibold text-white hover:bg-okada-dark disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-okada hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
