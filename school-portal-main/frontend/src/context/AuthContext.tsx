import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterPayload {
  name: string;
  idNumber: string;
  email?: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  gender?: string;
  grade?: string;
  department?: string;
}

interface AuthApiUser {
  id: string;
  name: string;
  loginId: string;
  email: string | null;
  role: UserRole;
}

interface AuthApiResponse {
  accessToken: string;
  user: AuthApiUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'school_portal_user';
const TOKEN_STORAGE_KEY = 'school_portal_token';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeUser = (apiUser: AuthApiUser): User => ({
  id: apiUser.id,
  idNumber: apiUser.loginId,
  name: apiUser.name || apiUser.loginId,
  email: apiUser.email || undefined,
  role: apiUser.role,
});

const parseApiErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    return data.message || 'Request failed';
  } catch {
    return 'Request failed';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!savedUser || !savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const profile = (await response.json()) as AuthApiUser;
        setUser(normalizeUser(profile));
        setToken(savedToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizeUser(profile)));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    identifier: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    if (!response.ok) {
      const errorMessage = await parseApiErrorMessage(response);
      return { success: false, error: errorMessage };
    }

    const data = (await response.json()) as AuthApiResponse;
    const normalizedUser = normalizeUser(data.user);
    setUser(normalizedUser);
    setToken(data.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);

    return { success: true };
  };

  const register = async (
    userData: RegisterPayload,
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorMessage = await parseApiErrorMessage(response);
      return { success: false, error: errorMessage };
    }

    const data = (await response.json()) as AuthApiResponse;
    const normalizedUser = normalizeUser(data.user);
    setUser(normalizedUser);
    setToken(data.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
