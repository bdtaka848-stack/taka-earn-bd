import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { Withdrawal, WithdrawalMethod } from '../../types.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import {
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  X,
  Send,
  Smartphone,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentMethodLogo } from '../common/PaymentLogos.js';

export const AdminWithdrawalManagement: React.FC = () => {
  const { adminToken, addToast, refreshUser } = useApp();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Action modal (Approve / Reject / Process)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'process' | 'complete' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/withdrawals', {
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const openActionModal = (wth: Withdrawal, type: 'approve' | 'process' | 'complete' | 'reject') => {
    setSelectedWithdrawal(wth);
    setActionType(type);
    setAdminNote('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    setSubmittingAction(true);

    try {
      let targetStatus = 'approved';
      if (actionType === 'process') targetStatus = 'processing';
      if (actionType === 'complete') targetStatus = 'completed';
      if (actionType === 'reject') targetStatus = 'rejected';

      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({
          status: targetStatus,
          adminNote: adminNote || `Updated to ${targetStatus} by administrative staff`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(
          'success',
          `Withdrawal marked as ${targetStatus}${targetStatus === 'rejected' ? ' and amount refunded to user!' : ''}`
        );
        setSelectedWithdrawal(null);
        fetchWithdrawals();
        refreshUser();
      } else {
        addToast('error', data.error || 'Failed to update withdrawal status');
      }
    } catch {
      addToast('error', 'Network error executing status change');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredList = withdrawals.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (methodFilter !== 'all' && w.method !== methodFilter) return false;
    return true;
  });

  const getStatusBadge = (status: Withdrawal['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-500/15 text-teal-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" /> Rejected (Refunded)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Withdrawal Requests & Payouts</h2>
          <p className="text-xs text-slate-400">
            Review user cashouts for bKash, Nagad, and USDT. Rejection automatically refunds user balance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Methods</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="USDT">USDT</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No withdrawal requests match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Method & Target</th>
                  <th className="pb-3 font-semibold">Gross</th>
                  <th className="pb-3 font-semibold">Fee</th>
                  <th className="pb-3 font-semibold">Net Payout</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((wth) => (
                  <tr key={wth.id} className="text-slate-300 hover:bg-slate-950/40 transition">
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-white">@{wth.username}</span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <PaymentMethodLogo method={wth.method} size={24} className="rounded-full shadow-sm" />
                        <span>{wth.method === 'USDT' ? 'Binance (USDT)' : wth.method}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px] mt-0.5">
                        {wth.details.accountNumber || wth.details.walletAddress}
                      </div>
                    </td>
                    <td className="py-3.5 font-mono">{formatBdt(wth.amount)}</td>
                    <td className="py-3.5 font-mono text-rose-400">-{formatBdt(wth.feeBdt)}</td>
                    <td className="py-3.5 font-mono font-bold text-emerald-400">
                      {formatBdt(wth.netAmount)}
                    </td>
                    <td className="py-3.5">{getStatusBadge(wth.status)}</td>
                    <td className="py-3.5 text-slate-400 text-[11px]">{formatDate(wth.createdAt)}</td>
                    <td className="py-3.5 text-right">
                      {wth.status === 'pending' || wth.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActionModal(wth, 'complete')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30"
                            title="Complete & Send"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => openActionModal(wth, 'process')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold text-[11px] border border-blue-500/30"
                            title="Mark Processing"
                          >
                            Processing
                          </button>
                          <button
                            onClick={() => openActionModal(wth, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[11px] border border-rose-500/30"
                            title="Reject & Refund"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {selectedWithdrawal && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white capitalize">
                  {actionType === 'reject' ? 'Reject & Refund' : `Mark as ${actionType}`}
                </h3>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="font-bold text-white">@{selectedWithdrawal.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Method:</span>
                  <span className="font-bold text-white">{selectedWithdrawal.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination:</span>
                  <span className="font-mono text-white">
                    {selectedWithdrawal.details.accountNumber || selectedWithdrawal.details.walletAddress}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-800 pt-1.5">
                  <span className="text-slate-300">Net Disbursement:</span>
                  <span className="font-mono text-emerald-400">{formatBdt(selectedWithdrawal.netAmount)}</span>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
                  <strong>Notice:</strong> Rejecting will automatically refund{' '}
                  <strong className="font-mono">{formatBdt(selectedWithdrawal.amount)}</strong> back into @
                  {selectedWithdrawal.username}'s available balance immediately.
                </div>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {actionType === 'complete' ? 'Transaction ID / Reference Note' : 'Audit Note'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      actionType === 'complete'
                        ? 'e.g. bKash TrxID: 9K72B4019Z'
                        : 'e.g. Account number verification failed'
                    }
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition ${
                      actionType === 'reject'
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {submittingAction ? 'Processing...' : 'Confirm Status Change'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
