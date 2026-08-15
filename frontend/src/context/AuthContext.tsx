import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
  };
  useEffect(() => {
    if (!localStorage.getItem('careerpilot_token')) {
      setLoading(false);
      return;
    }
    refresh()
      .catch(() => localStorage.removeItem('careerpilot_token'))
      .finally(() => setLoading(false));
  }, []);
  const accept = (data: { token: string; user: User }) => {
    localStorage.setItem('careerpilot_token', data.token);
    setUser(data.user);
  };
  const login = async (email: string, password: string) =>
    accept((await api.post('/auth/login', { email, password })).data);
  const googleLogin = async (credential: string) =>
    accept((await api.post('/auth/google', { credential })).data);
  const register = async (payload: Record<string, string>) =>
    accept((await api.post('/auth/register', payload)).data);
  const logout = () => {
    localStorage.removeItem('careerpilot_token');
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, googleLogin, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
