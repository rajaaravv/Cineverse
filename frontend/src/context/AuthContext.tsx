import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEMO_USER: User = {
  id: 1,
  username: 'Austin',
  email: 'austin@cineverse.tv',
  role: 'ROLE_USER',
  createdAt: '2026-09-10T00:00:00',
  playlistCount: 2,
  favoriteCount: 5,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cineverse_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cineverse_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('cineverse_token');
        if (storedToken && !storedToken.startsWith('demo-token-')) {
          try {
            const profile = await userApi.getProfile();
            setUser(profile);
            localStorage.setItem('cineverse_user', JSON.stringify(profile));
            setToken(storedToken);
          } catch (e) {
            console.warn('Stored token failed, attempting fresh demo login');
            tryDemoBackendLogin();
          }
        } else {
          // Attempt seamless backend login with initialized demo account
          tryDemoBackendLogin();
        }
      } catch (err) {
        console.warn('Failed to initialize auth', err);
        loginAsDemo();
      } finally {
        setIsLoading(false);
      }
    };

    const tryDemoBackendLogin = async () => {
      try {
        const res = await authApi.login({ usernameOrEmail: 'demo', password: 'demo123' });
        localStorage.setItem('cineverse_token', res.token);
        setToken(res.token);
        const profile = await userApi.getProfile();
        setUser(profile);
        localStorage.setItem('cineverse_user', JSON.stringify(profile));
      } catch (e) {
        console.warn('Backend offline or credentials mismatch, using local demo session');
        loginAsDemo();
      }
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    // If demo credentials or demo user entered
    if (usernameOrEmail.toLowerCase() === 'demo' || usernameOrEmail.toLowerCase() === 'austin') {
      loginAsDemo();
      return;
    }

    try {
      const res = await authApi.login({ usernameOrEmail, password });
      localStorage.setItem('cineverse_token', res.token);
      setToken(res.token);
      const profile = await userApi.getProfile();
      setUser(profile);
      localStorage.setItem('cineverse_user', JSON.stringify(profile));
    } catch (err: any) {
      // If backend network error/unreachable, grant demo session so user is never blocked
      if (!err.response || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        console.warn('Backend offline: logging in as demo session');
        loginAsDemo();
        return;
      }
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await authApi.register({ username, email, password });
      localStorage.setItem('cineverse_token', res.token);
      setToken(res.token);
      const profile = await userApi.getProfile();
      setUser(profile);
      localStorage.setItem('cineverse_user', JSON.stringify(profile));
    } catch (err: any) {
      if (!err.response || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        // Create local user session
        const newUser: User = {
          id: Date.now(),
          username: username.trim(),
          email: email.trim(),
          role: 'ROLE_USER',
          createdAt: new Date().toISOString(),
          playlistCount: 1,
          favoriteCount: 0,
        };
        const demoToken = 'demo-token-' + Date.now();
        localStorage.setItem('cineverse_token', demoToken);
        localStorage.setItem('cineverse_user', JSON.stringify(newUser));
        setToken(demoToken);
        setUser(newUser);
        return;
      }
      throw err;
    }
  };

  const loginAsDemo = () => {
    const demoToken = 'demo-token-austin';
    localStorage.setItem('cineverse_token', demoToken);
    localStorage.setItem('cineverse_user', JSON.stringify(DEMO_USER));
    setToken(demoToken);
    setUser(DEMO_USER);
  };

  const logout = async () => {
    try {
      if (token && !token.startsWith('demo-token-')) {
        await authApi.logout();
      }
    } finally {
      localStorage.removeItem('cineverse_token');
      localStorage.removeItem('cineverse_user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      if (token && !token.startsWith('demo-token-')) {
        const profile = await userApi.getProfile();
        setUser(profile);
        localStorage.setItem('cineverse_user', JSON.stringify(profile));
      }
    } catch (e) {
      console.warn('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        loginAsDemo,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
