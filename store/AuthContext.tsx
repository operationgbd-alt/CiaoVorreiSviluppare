import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface AuthUser {
  id: string;
  username: string;
  role: 'master' | 'ditta' | 'tecnico';
  name: string;
  email: string;
  companyId: string | null;
  companyName: string | null;
}

interface RegisterUserData {
  username: string;
  password: string;
  role: 'ditta' | 'tecnico';
  name: string;
  email: string;
  phone?: string;
  companyId: string;
  companyName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerUser: (userData: RegisterUserData) => Promise<{ success: boolean; userId: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'solartech_auth_token';
const USER_KEY = 'solartech_user';
const REGISTERED_USERS_KEY = 'solartech_registered_users';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEMO_ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  gbd: {
    password: 'master123',
    user: {
      id: 'master-1',
      username: 'gbd',
      role: 'master',
      name: 'GBD Amministratore',
      email: 'admin@gbd.it',
      companyId: null,
      companyName: null,
    },
  },
  ditta: {
    password: 'ditta123',
    user: {
      id: 'ditta-1',
      username: 'ditta',
      role: 'ditta',
      name: 'GBD B&A',
      email: 'info@gbd-ba.it',
      companyId: 'company-1',
      companyName: 'GBD B&A S.r.l.',
    },
  },
  alex: {
    password: 'tecnico123',
    user: {
      id: 'tech-1',
      username: 'alex',
      role: 'tecnico',
      name: 'Alessandro Rossi',
      email: 'alex@gbd-ba.it',
      companyId: 'company-1',
      companyName: 'GBD B&A S.r.l.',
    },
  },
  billo: {
    password: 'tecnico123',
    user: {
      id: 'tech-2',
      username: 'billo',
      role: 'tecnico',
      name: 'Marco Bianchi',
      email: 'billo@gbd-ba.it',
      companyId: 'company-1',
      companyName: 'GBD B&A S.r.l.',
    },
  },
  solarpro: {
    password: 'ditta123',
    user: {
      id: 'ditta-2',
      username: 'solarpro',
      role: 'ditta',
      name: 'Solar Pro',
      email: 'info@solarpro.it',
      companyId: 'company-2',
      companyName: 'Solar Pro S.r.l.',
    },
  },
  luca: {
    password: 'tecnico123',
    user: {
      id: 'tech-3',
      username: 'luca',
      role: 'tecnico',
      name: 'Luca Verdi',
      email: 'luca@solarpro.it',
      companyId: 'company-2',
      companyName: 'Solar Pro S.r.l.',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, { password: string; user: AuthUser }>>({});

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      const storedRegisteredUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      if (storedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(storedRegisteredUsers));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await api.login(username, password);
      if (result.success && result.data) {
        const { token, user: userData } = result.data;
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        api.setToken(token);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      console.log('API login failed, trying demo mode');
    }

    const demoAccount = DEMO_ACCOUNTS[username.toLowerCase()];
    if (demoAccount && demoAccount.password === password) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(demoAccount.user));
      setUser(demoAccount.user);
      return { success: true };
    }

    const registeredAccount = registeredUsers[username.toLowerCase()];
    if (registeredAccount && registeredAccount.password === password) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(registeredAccount.user));
      setUser(registeredAccount.user);
      return { success: true };
    }

    return { success: false, error: 'Credenziali non valide' };
  }, [registeredUsers]);

  const registerUser = useCallback(async (userData: RegisterUserData) => {
    const usernameKey = userData.username.toLowerCase();
    
    if (DEMO_ACCOUNTS[usernameKey] || registeredUsers[usernameKey]) {
      return { success: false, userId: '', error: 'Username già in uso' };
    }

    const userId = generateId();
    const newUser: AuthUser = {
      id: userId,
      username: userData.username.toLowerCase(),
      role: userData.role,
      name: userData.name,
      email: userData.email,
      companyId: userData.companyId,
      companyName: userData.companyName,
    };

    const updatedRegisteredUsers = {
      ...registeredUsers,
      [usernameKey]: {
        password: userData.password,
        user: newUser,
      },
    };

    try {
      await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedRegisteredUsers));
      setRegisteredUsers(updatedRegisteredUsers);
      return { success: true, userId };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, userId: '', error: 'Errore durante la registrazione' };
    }
  }, [registeredUsers]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      api.setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    registerUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
