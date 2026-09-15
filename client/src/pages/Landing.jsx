import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }
  if (user) return <Navigate to={user.role === 'rider' ? '/rider' : '/customer'} replace />;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-green-50 to-white">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="text-center">
          <div className="text-6xl" aria-hidden>🏍️</div>
          <h1 className="mt-4 text-3xl font-extrabold">Okada Connect</h1>
          <p className="mt-2 text-gray-600">
            Find a rider. Skip the roaming.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <Link
            to="/login?role=customer"
            className="block rounded-xl bg-okada px-6 py-4 text-center text-lg font-semibold text-white shadow hover:bg-okada-dark"
          >
            I need a ride
          </Link>
          <Link
            to="/login?role=rider"
            className="block rounded-xl border-2 border-okada px-6 py-4 text-center text-lg font-semibold text-okada shadow-sm hover:bg-green-50"
          >
            I'm an Okada Rider
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          New here?{' '}
          <Link to="/register" className="font-medium text-okada hover:underline">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
