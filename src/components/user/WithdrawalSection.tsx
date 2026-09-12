import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import { Withdrawal, WithdrawalMethod } from '../../types.js';
import {
  ArrowDownLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Sparkles,
  Smartphone,
  Coins,
} from 'lucide-react';
import {
  BKashAppLogo,
  NagadAppLogo,
  BinanceAppLogo,
  PaymentMethodLogo,
} from '../common/PaymentLogos.js';

export const WithdrawalSection: React.FC = () => {
  const { user, refreshUser, addToast, publicSettings } = useApp();

  const [method, setMethod] = useState<WithdrawalMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const minWithdrawal = publicSettings?.minWithdrawal ?? 2000;
  const maxWithdrawal = publicSettings?.maxWithdrawal ?? 20000;
  const feePercent = publicSettings?.withdrawalFeePercent ?? 2.5;
  const usdtRate = publicSettings?.usdtExchangeRate ?? 122;

  const numAmount = parseFloat(amount) || 0;
  const calculatedFee = Number(((numAmount * feePercent) / 100).toFixed(2));
  const netAmount = Math.max(0, Number((numAmount - calculatedFee).toFixed(2)));
  const usdtEquivalent = (netAmount / usdtRate).toFixed(2);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/wallet', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ৳${minWithdrawal}`);
      return;
    }

    if (numAmount > maxWithdrawal) {
      setError(`Maximum withdrawal amount is ৳${maxWithdrawal}`);
      return;
    }

    if (!user || user.balance < numAmount) {
      setError(`Insufficient balance. Your available balance is ৳${user?.balance.toFixed(2)}`);
      return;
    }

    if ((method === 'bKash' || method === 'Nagad') && (!accountNumber || accountNumber.length < 11)) {
      setError(`Please enter a valid 11-digit ${method} personal mobile number.`);
      return;
    }

    if (method === 'USDT' && (!walletAddress || walletAddress.length < 10)) {
      setError('Please provide a valid USDT TRC20/BEP20 address.');
      return;
    }

    setSubmitting(true);

    try {
      const details =
        method === 'USDT'
          ? { network: usdtNetwork, walletAddress }
          : { accountNumber };

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({
          method,
          details,
          amount: numAmount,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('success', `Withdrawal request for ${formatBdt(numAmount)} submitted successfully!`);
        setAmount('');
        setAccountNumber('');
        setWalletAddress('');
        await refreshUser();
        await fetchHistory();
      } else {
        setError(data.error || 'Failed to submit withdrawal request');
      }
    } catch {
      setError('Network connection error while submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

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
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instant & Automated Payouts</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>প্রসেসিং টাইম: ২৪ ঘণ্টার মধ্যে</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Withdraw Earnings
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Transfer your BDT rewards directly to your bKash, Nagad personal mobile account, or crypto USDT wallet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Withdrawal Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Create Cashout Request</h3>
              <p className="text-xs text-slate-400">Available: {formatBdt(user?.balance)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ২৪ ঘণ্টার মধ্যে উইথড্র
              </span>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">
                Fee: {feePercent}%
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Prominent 24-hour Processing Notice */}
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 font-semibold">প্রসেসিং সময়সূচী: </strong>
              টাকা উইথড্র করার প্রসেসিং টাইম <span className="text-white font-bold underline decoration-amber-400/50">২৪ ঘণ্টার মধ্যে</span> উইথড্র হয়ে যাবে।
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2.5">
                উইথড্র মেথড সিলেক্ট করুন (Select Method)
              </label>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setMethod('bKash')}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition cursor-pointer relative group ${
                    method === 'bKash'
                      ? 'bg-pink-950/40 border-pink-500 text-pink-200 shadow-xl shadow-pink-950/60 ring-2 ring-pink-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <BKashAppLogo size={52} className="group-hover:scale-105 transition-transform" />
                  <div className="text-center">
                    <span className="font-extrabold text-sm block text-white tracking-wide">bKash</span>
                    <span className="text-[10px] text-pink-400 font-medium">বিকাশ</span>
                  </div>
                  {method === 'bKash' && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow">
                      ✓
                    </span>
                  )}
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setMethod('Nagad')}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition cursor-pointer relative group ${
                    method === 'Nagad'
                      ? 'bg-orange-950/40 border-orange-500 text-orange-200 shadow-xl shadow-orange-950/60 ring-2 ring-orange-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <NagadAppLogo size={52} className="group-hover:scale-105 transition-transform" />
                  <div className="text-center">
                    <span className="font-extrabold text-sm block text-white tracking-wide">Nagad</span>
                    <span className="text-[10px] text-orange-400 font-medium">নগদ</span>
                  </div>
                  {method === 'Nagad' && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow">
                      ✓
                    </span>
                  )}
                </button>

                {/* Binance */}
                <button
                  type="button"
                  onClick={() => setMethod('USDT')}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition cursor-pointer relative group ${
                    method === 'USDT'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-xl shadow-amber-950/60 ring-2 ring-amber-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <BinanceAppLogo size={52} className="group-hover:scale-105 transition-transform" />
                  <div className="text-center">
                    <span className="font-extrabold text-sm block text-white tracking-wide">Binance</span>
                    <span className="text-[10px] text-amber-400 font-medium">USDT</span>
                  </div>
                  {method === 'USDT' && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-slate-950 font-bold shadow">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Fields based on method */}
            {method === 'bKash' || method === 'Nagad' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5">
                  {method === 'bKash' ? (
                    <BKashAppLogo size={26} className="rounded-full shadow-sm" />
                  ) : (
                    <NagadAppLogo size={26} className="rounded-full shadow-sm" />
                  )}
                  <label className="block text-xs font-semibold text-slate-200">
                    {method} Personal Mobile Number (ব্যক্তিগত নম্বর)
                  </label>
                </div>
                <input
                  type="tel"
                  required
                  placeholder={method === 'bKash' ? 'e.g. 017xxxxxxxx' : 'e.g. 019xxxxxxxx'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 outline-none transition"
                />
                <p className="text-[11px] text-slate-400">
                  নিশ্চিত করুন এটি আপনার সক্রিয় ব্যক্তিগত (Personal) {method} অ্যাকাউন্ট নম্বর।
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <BinanceAppLogo size={26} className="rounded-full shadow-sm" />
                  <span className="text-xs font-semibold text-slate-200">
                    Binance Pay ID / USDT Crypto Wallet
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Binance Network / Method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Binance Pay ID', 'TRC20', 'BEP20'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setUsdtNetwork(net)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          usdtNetwork === net
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/25'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {usdtNetwork === 'Binance Pay ID'
                      ? 'Binance Pay ID / Binance UID'
                      : `Binance USDT Wallet Address (${usdtNetwork})`}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      usdtNetwork === 'Binance Pay ID'
                        ? 'e.g. 849201842'
                        : usdtNetwork === 'BEP20'
                        ? 'e.g. 0x71C... (BNB Smart Chain)'
                        : 'e.g. TYDzsYUEpvnYmQK4zGP9s21K9QhLwHxyz7 (TRC20)'
                    }
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Exchange rate: 1 USDT = ~৳{usdtRate} BDT. আপনার Binance অ্যাকাউন্ট থেকে পে আইডি বা অ্যাড্রেস দিন।
                  </p>
                </div>
              </div>
            )}

            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Withdrawal Amount (BDT ৳)
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(String(user?.balance || 0))}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Max: {formatBdt(user?.balance)}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="2000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[2000, 3000, 5000, 10000, 15000, 20000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(String(quick))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      numAmount === quick
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ৳{quick >= 1000 ? `${(quick / 1000).toLocaleString()}k` : quick}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>উইথড্র লিমিট: <strong className="text-slate-200">৳{minWithdrawal} – ৳{maxWithdrawal.toLocaleString()}</strong></span>
                <span>ফি: {feePercent}%</span>
              </div>
            </div>

            {/* Calculation Breakdown Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount:</span>
                <span className="font-mono text-white">{formatBdt(numAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network Processing Fee ({feePercent}%):</span>
                <span className="font-mono text-rose-400">-{formatBdt(calculatedFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-slate-800/80 pt-2">
                <span>Net Payout to You:</span>
                <span className="font-mono text-emerald-400 text-sm">{formatBdt(netAmount)}</span>
              </div>
              {method === 'USDT' && netAmount > 0 && (
                <div className="text-[11px] text-emerald-400/80 font-mono text-right">
                  Approx. ${usdtEquivalent} USDT
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting || numAmount <= 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? 'Submitting Request...' : `Confirm & Withdraw ${formatBdt(netAmount)}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-amber-300/90 font-medium text-center">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>টাকা উইথড্র করার প্রসেসিং টাইম ২৪ ঘণ্টার মধ্যে উইথড্র হয়ে যাবে</span>
              </div>
            </div>
          </form>
        </div>

        {/* Withdrawal Policy & Instructions Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Policy & Rules</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>উইথড্র লিমিট (Withdrawal Limits):</strong> সর্বনিম্ন {formatBdt(minWithdrawal)} BDT থেকে সর্বোচ্চ {formatBdt(maxWithdrawal)} BDT পর্যন্ত।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span className="text-amber-200">
                  <strong>প্রসেসিং টাইম (Processing Time):</strong> টাকা উইথড্র করার প্রসেসিং টাইম ২৪ ঘণ্টার মধ্যে উইথড্র হয়ে যাবে।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Protection Guarantee:</strong> If a request is rejected by administration, the full amount is immediately refunded to your available balance.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Account Accuracy:</strong> Double check your bKash or Nagad wallet number before confirming.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* User's Withdrawal Requests History */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Your Recent Withdrawal Requests</h3>

        {loadingHistory ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No withdrawals requested yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Destination</th>
                  <th className="pb-3 font-semibold">Gross Amount</th>
                  <th className="pb-3 font-semibold">Net Payout</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((wth) => (
                  <tr key={wth.id} className="text-slate-300">
                    <td className="py-3 text-slate-400">{formatDate(wth.createdAt)}</td>
                    <td className="py-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <PaymentMethodLogo method={wth.method} size={24} className="rounded-full shadow-sm" />
                        <span>{wth.method === 'USDT' ? 'Binance (USDT)' : wth.method}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {wth.details.accountNumber || wth.details.walletAddress?.slice(0, 12) + '...'}
                    </td>
                    <td className="py-3 font-mono">{formatBdt(wth.amount)}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {formatBdt(wth.netAmount)}
                    </td>
                    <td className="py-3">{getStatusBadge(wth.status)}</td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">
                      {wth.adminNote || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
