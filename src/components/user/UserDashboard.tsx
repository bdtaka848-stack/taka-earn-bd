import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import { DashboardData } from '../../types.js';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Tv,
  Sparkles,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  Bell,
  Clock,
} from 'lucide-react';
import {
  BKashAppLogo,
  NagadAppLogo,
  BinanceAppLogo,
} from '../common/PaymentLogos.js';

export const UserDashboard: React.FC = () => {
  const { user, setUserView } = useApp();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/dashboard', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, user?.id, user?.balance]);

  const stats = data?.stats;
  const recentTransactions = data?.recentTransactions || [];
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      {/* Platform Announcements Banner */}
      {announcements.length > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/30 text-xs">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 truncate">
            <span className="font-bold text-emerald-300 mr-2">Special Update:</span>
            <span className="text-slate-300">{announcements[0]}</span>
          </div>
          <button
            onClick={() => setUserView('tasks')}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
          >
            <span>Explore Tasks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Balance & Earnings Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account Balance</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Current Wallet Balance</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight mt-1">
              {formatBdt(stats?.balance ?? user?.balance ?? 0)}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Today:</span>
                <strong className="text-emerald-400 font-mono">
                  {formatBdt(stats?.todayEarnings || 0)}
                </strong>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <span>Total Earned:</span>
                <strong className="text-white font-mono">
                  {formatBdt(stats?.totalEarnings ?? user?.totalEarned ?? 0)}
                </strong>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <span>Available to Withdraw:</span>
                <strong className="text-emerald-300 font-mono">
                  {formatBdt(stats?.availableWithdrawal ?? user?.balance ?? 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex flex-col gap-1">
              <button
                onClick={() => setUserView('withdraw')}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Withdraw BDT</span>
              </button>
              <div className="text-[10px] text-amber-300/90 text-center flex items-center justify-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>২৪ ঘণ্টার মধ্যে প্রসেস</span>
              </div>
            </div>
            <button
              onClick={() => setUserView('tasks')}
              className="flex-1 md:flex-none py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Browse Tasks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setUserView('tasks')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 flex flex-col items-center text-center group transition shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white">Tasks</span>
          <span className="text-[10px] text-slate-400">10s Ad Gate</span>
        </button>

        <button
          onClick={() => setUserView('watch_ads')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 flex flex-col items-center text-center group transition shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Tv className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white">Watch Ads</span>
          <span className="text-[10px] font-bold text-indigo-400">১৫s = ৳৫ (৫০০টি)</span>
        </button>

        <button
          onClick={() => setUserView('spin')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 flex flex-col items-center text-center group transition shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white">Spin Wheel</span>
          <span className="text-[10px] font-bold text-purple-400">দৈনিক ৫০০ স্পিন</span>
        </button>

        <button
          onClick={() => setUserView('refer')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 flex flex-col items-center text-center group transition shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white">Refer & Earn</span>
          <span className="text-[10px] font-bold text-emerald-400">প্রতি রেফারে ২৫ টাকা</span>
        </button>

        <button
          onClick={() => setUserView('withdraw')}
          className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 flex flex-col items-center text-center group transition shadow-md"
        >
          <div className="flex items-center -space-x-2.5 mb-2 group-hover:scale-105 transition-transform">
            <BKashAppLogo size={28} className="ring-2 ring-slate-900 shadow-sm" />
            <NagadAppLogo size={28} className="ring-2 ring-slate-900 shadow-sm" />
            <BinanceAppLogo size={28} className="ring-2 ring-slate-900 shadow-sm" />
          </div>
          <span className="text-xs font-bold text-white">Withdraw BDT</span>
          <span className="text-[10px] text-slate-400">bKash &bull; Nagad &bull; Binance</span>
        </button>
      </div>

      {/* Rewards Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.completedTasks ?? user?.completedTasksCount ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">Verified completions</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Referral Earnings</span>
            <Share2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {formatBdt(stats?.referralEarnings ?? user?.referralEarnings ?? 0)}
          </div>
          <span className="text-[11px] text-slate-500">From network friends</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Withdrawn</span>
            <ArrowDownLeft className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-200 font-mono">
            {formatBdt(stats?.totalWithdrawn ?? user?.totalWithdrawn ?? 0)}
          </div>
          <span className="text-[11px] text-slate-500">Paid out to wallets</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
          <button
            onClick={() => setUserView('wallet')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No activity yet. Start your first task to earn BDT!
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.slice(0, 5).map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatBdt(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
