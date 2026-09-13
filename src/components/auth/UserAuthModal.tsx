import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserAuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    loginUser,
    registerUser,
    allUsersList,
  } = useApp();

  // Registration states
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce check username availability for registration
  useEffect(() => {
    if (!showAuthModal || authModalMode !== 'register') return;

    const clean = regUsername.trim();
    if (!clean) {
      setUsernameAvailability({ checking: false });
      return;
    }

    if (!/^\d+$/.test(clean)) {
      setUsernameAvailability({
        checking: false,
        available: false,
        message: 'শুধুমাত্র সংখ্যা (0-9) ব্যবহার করতে পারবেন',
      });
      return;
    }

    if (clean.length < 8) {
      setUsernameAvailability({
        checking: false,
        available: false,
        message: `কমপক্ষে ৮টি সংখ্যা দিন (আর ${8 - clean.length}টি বাকি)`,
      });
      return;
    }

    if (clean.length > 16) {
      setUsernameAvailability({
        checking: false,
        available: false,
        message: 'সর্বোচ্চ ১৬টি সংখ্যা হতে পারবে',
      });
      return;
    }

    setUsernameAvailability({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username/${encodeURIComponent(clean)}`);
        const data = await res.json();
        setUsernameAvailability({
          checking: false,
          available: data.available,
          message: data.message,
        });
      } catch {
        setUsernameAvailability({ checking: false });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regUsername, showAuthModal, authModalMode]);

  if (!showAuthModal) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = regUsername.trim();
    const cleanPass = regPassword.trim();

    // Validate Username: 8 to 16 numeric digits
    if (!/^\d{8,16}$/.test(cleanUser)) {
      setError('Admin Username অপশনে শুধুমাত্র ৮ থেকে ১৬টি সংখ্যা (0-9) হতে হবে।');
      return;
    }

    // Validate Password: 6 to 12 characters
    if (cleanPass.length < 6 || cleanPass.length > 12) {
      setError('Admin Password অবশ্যই ৬ থেকে ১২ সংখ্যার বা অক্ষরের মধ্যে হতে হবে।');
      return;
    }

    if (cleanPass !== regConfirmPassword.trim()) {
      setError('পাসওয়ার্ড দুটি মেলেনি। অনুগ্রহ করে উভয় ঘরে একই পাসওয়ার্ড দিন।');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      username: cleanUser,
      password: cleanPass,
      name: regName.trim() || undefined,
      referralCode: regReferral.trim() || undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanUser) {
      setError('Admin Username লিখুন।');
      return;
    }

    if (!cleanPass) {
      setError('Admin Password লিখুন।');
      return;
    }

    setLoading(true);
    const result = await loginUser(cleanUser, cleanPass);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'লগইন করা সম্ভব হয়নি।');
    }
  };

  const fillQuickDemo = (u: { username: string }) => {
    setLoginUsername(u.username);
    setLoginPassword('123456');
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 relative my-8"
        >
          {/* Close button */}
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {authModalMode === 'login' ? 'অ্যাকাউন্ট লগইন' : 'নতুন অ্যাকাউন্ট রেজিস্ট্রেশন'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">TakaEarnBD Rewards Platform</p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                authModalMode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                authModalMode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>রেজিস্ট্রেশন (Register)</span>
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ===================== REGISTRATION FORM ===================== */}
          {authModalMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Rule reminder banner */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>রেজিস্ট্রেশন নীতিমালা:</span>
                </div>
                <p>
                  • <strong>Admin Username:</strong> ৮ থেকে ১৬ সংখ্যার ইউনিক নাম্বার (যেমন: মোবাইল নম্বর)।
                </p>
                <p>
                  • <strong>Admin Password:</strong> ৬ থেকে ১২ সংখ্যার বা অক্ষরের নিজস্ব গোপন পাসওয়ার্ড।
                </p>
              </div>

              {/* Admin Username (8-16 digits) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Username (৮-১৬ সংখ্যা)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      regUsername.length >= 8 && regUsername.length <= 16
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {regUsername.length}/16 সংখ্যা
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={16}
                    required
                    value={regUsername}
                    onChange={(e) => {
                      // Only allow numeric input
                      const val = e.target.value.replace(/\D/g, '');
                      setRegUsername(val);
                    }}
                    placeholder="যেমন: 01712345678 বা 12345678"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 font-mono outline-none transition"
                  />
                  {regUsername.length >= 8 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameAvailability.checking ? (
                        <span className="text-[10px] text-slate-400 animate-pulse">যাচাই হচ্ছে...</span>
                      ) : usernameAvailability.available ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Validation Status Notice */}
                {regUsername && usernameAvailability.message && (
                  <p
                    className={`text-[11px] mt-1 ${
                      usernameAvailability.available ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {usernameAvailability.message}
                  </p>
                )}
              </div>

              {/* Admin Password (6-12 characters) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Password (৬-১২ অক্ষর)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      regPassword.length >= 6 && regPassword.length <= 12
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {regPassword.length}/12 অক্ষর
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    maxLength={12}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="৬ থেকে ১২ অক্ষরের পাসওয়ার্ড"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  <span>পাসওয়ার্ড নিশ্চিত করুন</span>
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  maxLength={12}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="পুনরায় একই পাসওয়ার্ড লিখুন"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition ${
                    regConfirmPassword && regConfirmPassword !== regPassword
                      ? 'border-rose-500/70'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {regConfirmPassword && regConfirmPassword !== regPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">পাসওয়ার্ড দুটি মিলছে না</p>
                )}
              </div>

              {/* Optional Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    আপনার নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="যেমন: Sabbir Ahmed"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                {/* Optional Referral Code */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    রেফারেল কোড (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={regReferral}
                    onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                    placeholder="যেমন: BDT888"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono uppercase outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  regUsername.length < 8 ||
                  regUsername.length > 16 ||
                  regPassword.length < 6 ||
                  regPassword.length > 12 ||
                  regPassword !== regConfirmPassword
                }
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block animate-spin">⟳</span>
                ) : (
                  <>
                    <span>রেজিস্ট্রেশন সম্পূর্ণ করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-1">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setError(null);
                  }}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  লগইন করুন
                </button>
              </p>
            </form>
          )}

          {/* ===================== LOGIN FORM ===================== */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Admin Username */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Username (ইউজারনেম)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="আপনার ৮-১৬ সংখ্যার ইউজারনেম"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Password (পাসওয়ার্ড)</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার ৬-১২ অক্ষরের পাসওয়ার্ড"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !loginUsername || !loginPassword}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block animate-spin">⟳</span>
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Credentials Helper */}
              {allUsersList.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>দ্রুত ডেমো অ্যাকাউন্টে টেস্ট করতে চান?</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allUsersList.slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => fillQuickDemo(u)}
                        className="text-[10px] font-mono py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition"
                      >
                        @{u.username} (Pass: 123456)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-slate-400 pt-1">
                নতুন অ্যাকাউন্ট তৈরি করতে চান?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setError(null);
                  }}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  রেজিস্ট্রেশন করুন
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
