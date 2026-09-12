import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import {
  Users,
  CheckCircle2,
  Tv,
  Sparkles,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboardOverview: React.FC = () => {
  const { adminToken, setAdminView } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard', {
          headers: {
            'x-admin-token': adminToken || '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [adminToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-slate-900 border border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Administration Console</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Platform Operations & Metrics</h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of platform transactions, user activities, and financial liabilities.
          </p>
        </div>

        {stats?.pendingWithdrawalsCount > 0 && (
          <button
            onClick={() => setAdminView('withdrawals')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-semibold shrink-0"
          >
            <Clock className="w-4 h-4 animate-spin text-amber-400" />
            <span>{stats.pendingWithdrawalsCount} Pending Withdrawals Require Review</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Registered Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {stats?.activeUsers || 0} Active (non-blocked)
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400 font-mono">
            {stats?.completedTasks || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {stats?.totalTasks || 0} live task campaigns
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Paid Out</span>
            <ArrowDownLeft className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatBdt(stats?.totalWithdrawnBdt || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All-time settled disbursements</div>
        </div>

        {/* Pending Withdrawals */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Payouts</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatBdt(stats?.pendingWithdrawalsBdt || 0)}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            {stats?.pendingWithdrawalsCount || 0} requests awaiting action
          </div>
        </div>

        {/* Ad Views */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Ad Views</span>
            <Tv className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.totalAdViews || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">10s Ad Gate & Video views</div>
        </div>

        {/* Spin Rewards Distributed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Spin Rewards Paid</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {formatBdt(stats?.totalSpinRewardsBdt || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Provably fair wheel jackpots</div>
        </div>

        {/* Total User Balances (Liability) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">User Wallet Balances</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatBdt(stats?.totalUserBalancesBdt || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total pending platform balance liability</div>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Fraud Engine</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">Enforced</div>
          <div className="text-[11px] text-slate-400 mt-1">Server-side timer validation active</div>
        </div>
      </div>
    </div>
  );
};
