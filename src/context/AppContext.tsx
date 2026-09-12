import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SystemSettings } from '../types.js';

export type UserView =
  | 'home'
  | 'tasks'
  | 'watch_ads'
  | 'spin'
  | 'refer'
  | 'wallet'
  | 'withdraw'
  | 'profile';

export type AdminView =
  | 'dashboard'
  | 'users'
  | 'tasks'
  | 'rewards'
  | 'referrals'
  | 'withdrawals'
  | 'ads'
  | 'spin'
  | 'transactions'
  | 'settings'
  | 'audit_logs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextType {
  // Mode
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  adminToken: string | null;
  adminLogin: (token: string) => void;
  adminLogout: () => void;
  adminView: AdminView;
  setAdminView: (v: AdminView) => void;

  // User State
  user: User | null;
  userView: UserView;
  setUserView: (v: UserView) => void;
  refreshUser: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  allUsersList: Array<{ id: string; username: string; name: string; balance: number }>;

  // Settings
  publicSettings: Partial<SystemSettings> | null;
  refreshSettings: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  removeToast: (id: string) => void;

  // Dialogs
  showAdminLoginModal: boolean;
  setShowAdminLoginModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('taskbdt_admin_token');
  });
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1';
  });
  const [userView, setUserView] = useState<UserView>('home');
  const [allUsersList, setAllUsersList] = useState<Array<{ id: string; username: string; name: string; balance: number }>>([]);
  const [publicSettings, setPublicSettings] = useState<Partial<SystemSettings> | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': currentUserId },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error('Failed to fetch current user:', e);
    }
  }, [currentUserId]);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        setPublicSettings(data);
      }
    } catch (e) {
      console.error('Failed to fetch public settings:', e);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users-list');
      if (res.ok) {
        const data = await res.json();
        setAllUsersList(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users list:', e);
    }
  }, []);

  const switchUser = async (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem('taskbdt_current_user_id', userId);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        addToast('info', `Switched active demo account to @${data.user.username}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const adminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('taskbdt_admin_token', token);
    setIsAdminMode(true);
    setShowAdminLoginModal(false);
    addToast('success', 'Admin session authenticated successfully. Welcome, Administrator!');
  };

  const adminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('taskbdt_admin_token');
    setIsAdminMode(false);
    addToast('info', 'Logged out of admin panel.');
  };

  useEffect(() => {
    refreshUser();
    refreshSettings();
    loadAllUsers();
  }, [refreshUser, refreshSettings, loadAllUsers]);

  return (
    <AppContext.Provider
      value={{
        isAdminMode,
        setIsAdminMode,
        adminToken,
        adminLogin,
        adminLogout,
        adminView,
        setAdminView,
        user,
        userView,
        setUserView,
        refreshUser,
        switchUser,
        allUsersList,
        publicSettings,
        refreshSettings,
        toasts,
        addToast,
        removeToast,
        showAdminLoginModal,
        setShowAdminLoginModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
