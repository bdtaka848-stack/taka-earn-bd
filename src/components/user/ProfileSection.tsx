import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Calendar,
  Sparkles,
  Share2,
  Copy,
  Users,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  LogOut,
  Hash,
  Lock,
} from 'lucide-react';

export const ProfileSection: React.FC = () => {
  const {
    user,
    allUsersList,
    switchUser,
    addToast,
    setUserView,
    openAuthModal,
    userLogout,
  } = useApp();

  const [showPassword, setShowPassword] = useState(false);

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-md mx-auto my-12">
        <KeyRound className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">আপনি লগইন অবস্থায় নেই</h3>
        <p className="text-xs text-slate-400 mb-6">
          অ্যাকাউন্ট বিবরণী দেখতে ও আয় উত্তোলন করতে আপনার Admin Username ও Password দিয়ে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            লগইন করুন
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
          >
            নতুন রেজিস্ট্রেশন
          </button>
        </div>
      </div>
    );
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label} কপি করা হয়েছে!`);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160'}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover ring-2 ring-emerald-500/40 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user.name}</h2>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">@{user.username} • {user.email}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatBdt(user.balance)}
            </div>
            <button
              onClick={() => setUserView('withdraw')}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Withdraw Funds →
            </button>
          </div>
        </div>
      </div>

      {/* Account Login Credentials & Actions Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">আমার লগইন তথ্য (Account Credentials)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              পরবর্তীতে অ্যাকাউন্টে লগইন করতে আপনার এই Admin Username এবং Admin Password প্রয়োজন হবে।
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => openAuthModal('register')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন একাউন্ট রেজিস্টার</span>
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
            <button
              onClick={userLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admin Username Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-400" /> Admin Username (৮-১৬ সংখ্যা)
              </span>
              <div className="text-base font-bold font-mono text-white mt-1">
                {user.username}
              </div>
            </div>
            <button
              onClick={() => copyText(user.username, 'Admin Username')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="কপি করুন"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Admin Password Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Admin Password (৬-১২ অক্ষর)
              </span>
              <div className="text-base font-bold font-mono text-white mt-1 flex items-center gap-2">
                <span>{showPassword ? (user.password || '123456') : '••••••••'}</span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => copyText(user.password || '123456', 'Admin Password')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="কপি করুন"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Account Performance Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Earned</span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {formatBdt(user.totalEarned)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Tasks Done</span>
          <div className="text-lg font-bold text-teal-400 font-mono mt-1">
            {user.completedTasksCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Referrals</span>
          <div className="text-lg font-bold text-blue-400 font-mono mt-1">
            {user.referralsCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Withdrawn</span>
          <div className="text-lg font-bold text-slate-200 font-mono mt-1">
            {formatBdt(user.totalWithdrawn)}
          </div>
        </div>
      </div>

      {/* Demo Account Switcher Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Switch Demo Profile</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test multiple user experiences, existing task completions, and withdrawal histories seamlessly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allUsersList.map((u) => {
            const isSelected = u.id === user.id;
            return (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{u.name}</h4>
                  <p className="text-[11px] text-slate-400">@{u.username}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatBdt(u.balance)}
                  </span>
                  {isSelected && (
                    <span className="block text-[9px] uppercase font-bold text-emerald-400">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
