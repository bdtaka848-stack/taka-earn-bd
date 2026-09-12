import React from 'react';
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
} from 'lucide-react';

export const ProfileSection: React.FC = () => {
  const { user, allUsersList, switchUser, addToast, setUserView } = useApp();

  if (!user) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    addToast('success', 'Referral code copied!');
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
              <p className="text-xs text-slate-400">@{user.username} &bull; {user.email}</p>
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
              Withdraw Funds &rarr;
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
