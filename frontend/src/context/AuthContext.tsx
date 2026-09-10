import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../types';
import { loginUser, registerUser } from '../services/authService';
import { AUTH_SESSION_INVALIDATED_EVENT } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Currently authenticated user, or null if unauthenticated. */
  user: AuthUser | null;
  /** True while the initial localStorage restore is in progress. */
  isLoading: boolean;
  /** Authenticate with the backend; persists user to localStorage on success. */
  login: (data: LoginRequest) => Promise<void>;
  /** Clear session from state and localStorage. */
  logout: () => void;
  /** Register a new account; returns the created user record. */
  register: (data: RegisterRequest) => Promise<UserResponse>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'careerlens_session';

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { user?: AuthUser; token?: string };
        if (session.user && session.token) {
          setUser(session.user);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleInvalidSession = () => {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener(AUTH_SESSION_INVALIDATED_EVENT, handleInvalidSession);
    return () => window.removeEventListener(AUTH_SESSION_INVALIDATED_EVENT, handleInvalidSession);
  }, []);

  const login = async (data: LoginRequest): Promise<void> => {
    const response = await loginUser(data);
    const authUser: AuthUser = {
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: authUser, token: response.token }));
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('careerlens_user');
  };

  const register = async (data: RegisterRequest): Promise<UserResponse> => {
    return registerUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
