import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken, getToken } from '../services/api';

type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'rider';
  photoUrl?: string | null;
  createdAt: string;
};

type AuthValue = {
  user: User | null;
  loading: boolean;
  register: (payload: Record<string, unknown>) => Promise<User>;
  login: (payload: { email: string; password: string; role?: 'customer' | 'rider' }) => Promise<User>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored token on mount.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setToken(null)) // stale/invalid token — clear it
      .finally(() => setLoading(false));
  }, []);

  async function register(payload: Record<string, unknown>) {
    const data = await api.register(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(payload: { email: string; password: string; role?: 'customer' | 'rider' }) {
    const data = await api.login(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function updateUser(updated: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }

  const value = { user, loading, register, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
