import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import { Transaction, Withdrawal } from '../../types.js';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tv,
  Share2,
  RefreshCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BKashAppLogo,
  NagadAppLogo,
  BinanceAppLogo,
} from '../common/PaymentLogos.js';

export const WalletSection: React.FC = () => {
  const { user, setUserView } = useApp();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    referralEarnings: number;
    taskEarnings: number;
    adEarnings: number;
    spinEarnings: number;
    transactions: Transaction[];
    withdrawals: Withdrawal[];
  } | null>(null);

  const [filterType, setFilterType] = useState<string>('all');

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wallet', {
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
    fetchWallet();
  }, [fetchWallet, user?.id, user?.balance]);

  const transactions = data?.transactions || [];

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'task':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-400 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> TASK
          </span>
        );
      case 'ad':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[10px] font-bold">
            <Tv className="w-3 h-3" /> AD
          </span>
        );
      case 'spin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-400 text-[10px] font-bold">
            <Sparkles className="w-3 h-3" /> SPIN
          </span>
        );
      case 'referral':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 text-[10px] font-bold">
            <Share2 className="w-3 h-3" /> REFERRAL
          </span>
        );
      case 'withdrawal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-bold">
            <ArrowDownLeft className="w-3 h-3" /> WITHDRAWAL
          </span>
        );
      case 'withdrawal_refund':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold">
            <RefreshCcw className="w-3 h-3" /> REFUND
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
            ADJUSTMENT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Wallet className="w-3.5 h-3.5" />
              <span>Verified BDT Multi-Asset Wallet</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Available Balance for Cashout</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight mt-1">
              {formatBdt(data?.availableBalance ?? user?.balance)}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>
                Pending in Processing:{' '}
                <strong className="text-amber-400 font-mono">
                  {formatBdt(data?.pendingBalance || 0)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Total Withdrawn:{' '}
                <strong className="text-slate-200 font-mono">
                  {formatBdt(data?.totalWithdrawn || 0)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex flex-col gap-1">
              <button
                onClick={() => setUserView('withdraw')}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Withdraw BDT</span>
              </button>
              <div className="text-[10px] text-amber-300/90 text-center flex items-center justify-center gap-1 font-medium mt-0.5">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>প্রসেসিং টাইম: ২৪ ঘণ্টার মধ্যে</span>
              </div>
            </div>
            <button
              onClick={() => setUserView('tasks')}
              className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Earn More Tasks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supported Cashout Methods - bKash, Nagad, Binance (Original Circular Logos) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              সাপোর্টেড উইথড্র ওয়ালেট (Supported Wallets)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              Instant
            </span>
          </div>
          <button
            onClick={() => setUserView('withdraw')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <span>টাকা তুলুন</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* bKash */}
          <button
            type="button"
            onClick={() => setUserView('withdraw')}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 hover:bg-pink-950/20 flex flex-col items-center justify-center gap-2.5 transition group cursor-pointer"
          >
            <BKashAppLogo size={52} className="group-hover:scale-105 transition-transform" />
            <div className="text-center">
              <span className="text-sm font-extrabold text-white block tracking-wide">bKash</span>
              <span className="text-[10px] text-pink-400 font-medium">বিকাশ ওয়ালেট</span>
            </div>
          </button>

          {/* Nagad */}
          <button
            type="button"
            onClick={() => setUserView('withdraw')}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/50 hover:bg-orange-950/20 flex flex-col items-center justify-center gap-2.5 transition group cursor-pointer"
          >
            <NagadAppLogo size={52} className="group-hover:scale-105 transition-transform" />
            <div className="text-center">
              <span className="text-sm font-extrabold text-white block tracking-wide">Nagad</span>
              <span className="text-[10px] text-orange-400 font-medium">নগদ ওয়ালেট</span>
            </div>
          </button>

          {/* Binance */}
          <button
            type="button"
            onClick={() => setUserView('withdraw')}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 hover:bg-amber-950/20 flex flex-col items-center justify-center gap-2.5 transition group cursor-pointer"
          >
            <BinanceAppLogo size={52} className="group-hover:scale-105 transition-transform" />
            <div className="text-center">
              <span className="text-sm font-extrabold text-white block tracking-wide">Binance</span>
              <span className="text-[10px] text-amber-400 font-medium">USDT পে আইডি</span>
            </div>
          </button>
        </div>
      </div>

      {/* Income Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Tasks Earnings</span>
          <div className="text-lg font-bold text-teal-400 font-mono mt-1">
            {formatBdt(data?.taskEarnings || user?.taskEarnings || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Video Ads Earnings</span>
          <div className="text-lg font-bold text-indigo-400 font-mono mt-1">
            {formatBdt(data?.adEarnings || user?.adEarnings || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Spin Wheel Earnings</span>
          <div className="text-lg font-bold text-purple-400 font-mono mt-1">
            {formatBdt(data?.spinEarnings || user?.spinEarnings || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Referral Earnings</span>
          <div className="text-lg font-bold text-blue-400 font-mono mt-1">
            {formatBdt(data?.referralEarnings || user?.referralEarnings || 0)}
          </div>
        </div>
      </div>

      {/* Complete Transaction History */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Transaction Ledger</h3>
            <p className="text-xs text-slate-400">All earning rewards, cashouts, and balance events</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {['all', 'task', 'ad', 'spin', 'referral', 'withdrawal'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${
                  filterType === type
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No transactions found for this filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {getTxTypeBadge(tx.type)}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md">
                        {tx.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold font-mono ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatBdt(tx.amount)}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold ${
                        tx.status === 'completed'
                          ? 'text-emerald-400'
                          : tx.status === 'pending'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.status}
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
