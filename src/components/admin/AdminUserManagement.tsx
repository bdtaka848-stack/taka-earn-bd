import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { User, Transaction } from '../../types.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  X,
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminUserManagement: React.FC = () => {
  const { adminToken, addToast, refreshUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');

  // Balance adjustment modal
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // User History modal
  const [historyModalUser, setHistoryModalUser] = useState<User | null>(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBlock = async (user: User) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} user @${user.username}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({ isBlocked: !user.isBlocked }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', `User @${user.username} is now ${!user.isBlocked ? 'blocked' : 'unblocked'}.`);
        fetchUsers();
        refreshUser();
      } else {
        addToast('error', data.error || 'Failed to update user block status');
      }
    } catch {
      addToast('error', 'Network error updating user');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;

    const numAmount = parseFloat(adjustAmount);
    if (!numAmount || numAmount <= 0) {
      addToast('error', 'Enter a valid amount');
      return;
    }

    setAdjustSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${balanceModalUser.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({
          type: adjustType,
          amount: numAmount,
          reason: adjustReason || 'Administrative Balance Adjustment',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', `Adjusted balance for @${balanceModalUser.username}!`);
        setBalanceModalUser(null);
        setAdjustAmount('');
        setAdjustReason('');
        fetchUsers();
        refreshUser();
      } else {
        addToast('error', data.error || 'Failed to adjust balance');
      }
    } catch {
      addToast('error', 'Network error adjusting balance');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const viewUserHistory = async (u: User) => {
    setHistoryModalUser(u);
    setUserHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/history`, {
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUserHistoryLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'active') return !u.isBlocked;
    if (filterStatus === 'blocked') return u.isBlocked;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">User Account Directory</h2>
          <p className="text-xs text-slate-400">
            View member balances, adjust funds, manage account security, and review individual user ledgers.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none w-56 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {(['all', 'active', 'blocked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No users found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Total Earned</th>
                  <th className="pb-3 font-semibold">Tasks Completed</th>
                  <th className="pb-3 font-semibold">Joined</th>
                  <th className="pb-3 font-semibold">Account Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-slate-300 hover:bg-slate-950/40 transition">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={u.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            <span className="text-emerald-400 font-bold">User:</span> {u.username} | <span className="text-amber-400 font-bold">Pass:</span> {u.password || '123456'}
                          </div>
                          <div className="text-slate-500 text-[10px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-emerald-400">
                      {formatBdt(u.balance)}
                    </td>
                    <td className="py-3.5 font-mono text-slate-300">
                      {formatBdt(u.totalEarned)}
                    </td>
                    <td className="py-3.5 font-mono text-teal-400">
                      {u.completedTasksCount}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3.5">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewUserHistory(u)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          title="View Ledger History"
                        >
                          <History className="w-3.5 h-3.5 inline mr-1" />
                          <span>History</span>
                        </button>

                        <button
                          onClick={() => setBalanceModalUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30 transition"
                          title="Adjust Balance"
                        >
                          <Wallet className="w-3.5 h-3.5 inline mr-1" />
                          <span>Adjust</span>
                        </button>

                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            u.isBlocked
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                          }`}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {balanceModalUser && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Adjust User Balance</h3>
                  <p className="text-xs text-slate-400">
                    Target: @{balanceModalUser.username} (Current: {formatBdt(balanceModalUser.balance)})
                  </p>
                </div>
                <button
                  onClick={() => setBalanceModalUser(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('add')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                        adjustType === 'add'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Credit (Add BDT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('deduct')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                        adjustType === 'deduct'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Debit (Deduct BDT)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Amount (BDT ৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="50.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Audit Reason
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campaign bonus compensation / Anti-fraud adjustment"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBalanceModalUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                  >
                    {adjustSubmitting ? 'Applying...' : 'Apply Balance Change'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* User History Modal */}
      {historyModalUser && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ledger History: @{historyModalUser.username}
                  </h3>
                  <p className="text-xs text-slate-400">{historyModalUser.email}</p>
                </div>
                <button
                  onClick={() => setHistoryModalUser(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {userHistoryLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading ledger...</div>
              ) : userTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No transactions recorded for this user.</div>
              ) : (
                <div className="space-y-2">
                  {userTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{tx.description}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(tx.createdAt)} • {tx.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.amount > 0 ? '+' : ''}
                          {formatBdt(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
