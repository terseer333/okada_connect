import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <Link to="/" className="flex items-center gap-2 font-bold">
        <span aria-hidden>🏍️</span>
        <span>OKADA CONNECT</span>
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
