import React, { useState } from 'react';
import { useApp, UserView } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import {
  Wallet,
  Shield,
  UserCheck,
  ChevronDown,
  Sparkles,
  LogOut,
  Flame,
  CheckCircle2,
  Tv,
  Gift,
  Share2,
  ArrowDownLeft,
  User as UserIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    userView,
    setUserView,
    isAdminMode,
    setIsAdminMode,
    adminToken,
    setShowAdminLoginModal,
    adminLogout,
    allUsersList,
    switchUser,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems: Array<{ key: UserView; label: string; icon: React.ReactNode }> = [
    { key: 'home', label: 'Home', icon: <Flame className="w-4 h-4" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'watch_ads', label: 'Watch Ads', icon: <Tv className="w-4 h-4" /> },
    { key: 'spin', label: 'Spin & Earn', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'refer', label: 'Refer & Earn', icon: <Share2 className="w-4 h-4" /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { key: 'withdraw', label: 'Withdraw', icon: <ArrowDownLeft className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (isAdminMode) setIsAdminMode(false);
                setUserView('home');
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform duration-200">
                <span className="font-bold text-lg leading-none">৳</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-white tracking-tight">TakaEarnBD</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Earn in Bangladeshi Taka</p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            {!isAdminMode && (
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = userView === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setUserView(item.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Action Section */}
          <div className="flex items-center gap-3">
            {/* User Balance Chip (when in user mode) */}
            {!isAdminMode && user && (
              <button
                onClick={() => setUserView('wallet')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-md transition-all group"
                title="Click to view full wallet details"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold leading-none">
                    Balance
                  </div>
                  <div className="text-sm font-bold text-emerald-400 leading-tight">
                    {formatBdt(user.balance)}
                  </div>
                </div>
              </button>
            )}

            {/* User switcher & profile menu */}
            {!isAdminMode && user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                    alt={user.name}
                    className="w-7 h-7 rounded-xl object-cover ring-1 ring-emerald-500/30"
                  />
                  <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-white font-bold">{user.name}</p>
                      <p className="text-slate-400 text-[11px]">@{user.username}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Account Active
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserView('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>My Profile & Referral Code</span>
                    </button>

                    <div className="my-1 border-t border-slate-800/80 pt-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Switch Demo Account
                      </div>
                      {allUsersList.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition ${
                            u.id === user.id
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <UserCheck className="w-3.5 h-3.5 opacity-60" />
                            <span className="truncate">@{u.username}</span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-400 ml-2">
                            {formatBdt(u.balance)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Panel Toggle Button */}
            {isAdminMode ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAdminMode(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <span>User View</span>
                </button>
                <button
                  onClick={adminLogout}
                  className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                  title="Logout Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (adminToken) {
                    setIsAdminMode(true);
                  } else {
                    setShowAdminLoginModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold shadow-md transition-all group"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
