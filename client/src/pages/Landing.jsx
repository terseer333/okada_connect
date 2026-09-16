import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTypewriter } from '../hooks/useTypewriter.js';
import BikeScene from '../components/BikeScene.jsx';
import CountUp from '../components/CountUp.jsx';

const TAGLINES = [
  'Find a rider. Skip the roaming.',
  'Your ride. Nearby.',
  'Connecting riders and customers, smarter.',
  'No roaming. No waiting. Just ride.',
];

const STEPS = [
  { icon: '📍', title: 'Confirm your spot', text: 'Share your location and confirm your pickup point on the map.' },
  { icon: '🏍️', title: 'A rider accepts', text: 'Nearby online riders get your request — the closest one grabs it.' },
  { icon: '⚡', title: 'Ride!', text: 'Track your rider approaching and hop on. Simple.' },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const { text: typedText, phase } = useTypewriter(TAGLINES);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  if (user) return <Navigate to={user.role === 'rider' ? '/rider' : '/customer'} replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <main className="mx-auto w-full max-w-md px-6 py-10">
        {/* Live badge */}
        <div className="rise flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-green-100">
            <span className="live-dot h-2 w-2 rounded-full bg-okada" aria-hidden />
            Riders online near you
          </span>
        </div>

        {/* Hero */}
        <div className="rise mt-6 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="text-6xl" aria-hidden>🏍️</div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
            Okada<span className="text-okada">Connect</span>
          </h1>

          {/* Continuously typing headline */}
          <p className="mt-3 flex min-h-8 items-center justify-center text-lg font-medium text-gray-700" aria-live="polite">
            <span>{typedText}</span>
            <span className="tw-cursor ml-0.5 inline-block h-6 w-0.5 bg-okada" aria-hidden />
          </p>
        </div>

        {/* Animated street scene */}
        <div className="rise mt-6" style={{ animationDelay: '0.2s' }}>
          <BikeScene />
          <p className="mt-1.5 text-center text-xs text-gray-400">
            psst — tap the bike for turbo 💨
          </p>
        </div>

        {/* Primary CTA */}
        <div className="rise mt-6" style={{ animationDelay: '0.3s' }}>
          <Link
            to="/login?role=customer"
            className="cta-shine block rounded-xl bg-okada px-6 py-4 text-center text-lg font-bold text-white shadow-lg shadow-green-600/20 transition-transform hover:scale-[1.02] hover:bg-okada-dark active:scale-95"
          >
            Login to get your fast ride ⚡
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              to="/login?role=rider"
              className="rounded-xl border-2 border-okada px-4 py-3 text-center font-semibold text-okada shadow-sm transition-transform hover:scale-[1.02] hover:bg-green-50 active:scale-95"
            >
              🏍️ I'm a rider
            </Link>
            <Link
              to="/register"
              className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center font-semibold text-gray-600 shadow-sm transition-transform hover:scale-[1.02] hover:border-gray-300 active:scale-95"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Stats dashboard */}
        <div className="rise mt-8 grid grid-cols-3 gap-3" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-xl font-extrabold text-okada">
              <CountUp value={3} suffix=" km" />
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Search radius
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-xl font-extrabold text-okada">
              <CountUp value={24} suffix="/7" />
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Rider availability
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-xl font-extrabold text-okada">
              <CountUp value={60} suffix="s" />
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              To a match
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="rise mt-8" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-center text-sm font-bold uppercase tracking-wider text-gray-400">
            How it works
          </h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rise flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                style={{ animationDelay: `${0.6 + i * 0.15}s` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xl" aria-hidden>
                  {step.icon}
                </span>
                <div>
                  <p className="font-semibold">
                    <span className="mr-1.5 text-okada">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Ready to ride?{' '}
          <Link to="/login?role=customer" className="font-medium text-okada hover:underline">
            Login to get your fast ride
          </Link>
        </p>
      </main>
    </div>
  );
}
