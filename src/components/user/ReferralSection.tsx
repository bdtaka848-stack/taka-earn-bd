import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt, formatDate } from '../../utils/format.js';
import { Referral, ReferralSettings } from '../../types.js';
import {
  Share2,
  Copy,
  Check,
  Users,
  Gift,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Coins,
  ArrowRight,
  MessageCircle,
  Send,
  UserPlus,
} from 'lucide-react';

export const ReferralSection: React.FC = () => {
  const { user, addToast, refreshUser } = useApp();

  const [referralCode, setReferralCode] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [history, setHistory] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  // Instant Friend Invite / Simulation state
  const [inviteFriendName, setInviteFriendName] = useState('');
  const [inviting, setInviting] = useState(false);

  // Apply referral code state
  const [inputCode, setInputCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/referrals', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode || user?.referralCode || 'BDT888');
        setTotalReferrals(data.totalReferrals || 0);
        setActiveReferrals(data.activeReferrals || 0);
        setReferralEarnings(data.referralEarnings || 0);
        setSettings(data.settings);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user?.id, user?.referralCode]);

  const referralLink = `${window.location.origin}?ref=${referralCode || user?.referralCode || 'BDT888'}`;
  const shareMessage = `TakaEarnBD তে প্রতিদিন কাজ করে টাকা ইনকাম করুন! আমার রেফারেল কোড ${referralCode || user?.referralCode || 'BDT888'} ব্যবহার করে একাউন্ট খুলুন। বিকাশ, নগদ ও বাইন্যান্সে সরাসরি টাকা তুলুন: ${referralLink}`;

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('success', 'রেফার কোড কপি করা হয়েছে!');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      addToast('success', 'রেফার লিংক কপি করা হয়েছে!');
    }
  };

  const handleInviteFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviting) return;
    setInviting(true);
    try {
      const res = await fetch('/api/referrals/invite-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({ friendName: inviteFriendName || 'Friend' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(
          'success',
          `🎉 অভিনন্দন! ১টি রেফার সম্পন্ন হয়েছে। আপনার ওয়ালেটে ৳${data.reward || 25} যোগ করা হয়েছে!`,
          '৳২৫ রেফার বোনাস যুক্ত হয়েছে'
        );
        setInviteFriendName('');
        await refreshUser();
        await fetchReferrals();
      } else {
        addToast('error', data.error || 'রেফার যোগ করা সম্ভব হয়নি।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা দেখা দিয়েছে।');
    } finally {
      setInviting(false);
    }
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || applyingCode) return;
    setApplyingCode(true);
    try {
      const res = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({ referralCode: inputCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', data.message, 'রেফার কোড সফল');
        setInputCode('');
        await refreshUser();
        await fetchReferrals();
      } else {
        addToast('error', data.error || 'রেফার কোড প্রয়োগ করা যায়নি।');
      }
    } catch (err) {
      addToast('error', 'রেফার কোড প্রয়োগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setApplyingCode(false);
    }
  };

  const bonusAmount = Number(settings?.fixedAmount || 25.0);

  const earningsTiers = [
    { refs: 1, earn: 25, label: '১টি রেফার', badge: 'শুরু' },
    { refs: 4, earn: 100, label: '৪টি রেফার', badge: 'জনপ্রিয়' },
    { refs: 10, earn: 250, label: '১০টি রেফার', badge: 'সুপার' },
    { refs: 20, earn: 500, label: '২০টি রেফার', badge: 'উইথড্র উপযোগী' },
    { refs: 40, earn: 1000, label: '৪০টি রেফার', badge: 'মেগা আর্নার' },
    { refs: 100, earn: 2500, label: '১০০টি রেফার', badge: 'কিং আর্নার' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Prominent Banner - ৳25 Bonus Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/50 to-slate-900 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>অফার: প্রতি রেফারে নিশ্চিত ২৫ টাকা ইনস্ট্যান্ট বোনাস</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            রেফার বোনাস <span className="text-emerald-400 underline decoration-emerald-500/50">২৫ টাকা</span> করে ইনকাম!
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            ১টি রেফার করলে পাবেন <strong className="text-emerald-300 font-bold">২৫ টাকা</strong>।
            এরকম আপনি <strong className="text-white font-bold">যতো রেফার করবেন, প্রতি রেফারের জন্য ২৫ টাকা</strong> করে
            ইনকাম সরাসরি আপনার ব্যালেন্সে সাথে সাথে যোগ হবে! কোনো সীমা বা লিমিট নেই—আনলিমিটেড রেফার করুন ও ইনকাম করুন।
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>১ রেফার = ৳২৫.০০</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ইনস্ট্যান্ট ওয়ালেট ক্রেডিট</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>আনলিমিটেড রেফার করার সুযোগ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code & Direct Share Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Your Referral Code Box */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                আপনার নিজস্ব রেফারেল কোড (Your Referral Code)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ৳২৫ বোনাস
              </span>
            </div>
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest">
                {referralCode || user?.referralCode || 'BDT888'}
              </span>
              <button
                onClick={() => copyToClipboard(referralCode || user?.referralCode || 'BDT888', true)}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>কোড কপি</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              আপনার বন্ধুরা একাউন্ট খোলার সময় এই কোডটি বসালেই আপনি তাৎক্ষণিক ৳২৫ পাবেন।
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              সোশ্যাল মিডিয়াতে সরাসরি শেয়ার করুন:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>হোয়াটসঅ্যাপ</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('TakaEarnBD তে যোগ দিয়ে প্রতিদিন ২৫ টাকা রেফার বোনাস ও টাকা ইনকাম করুন!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>টেলিগ্রাম</span>
              </a>
            </div>
          </div>
        </div>

        {/* Direct Link & Instant Test Box */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              সরাসরি রেফারেল লিংক (Direct Referral Link)
            </span>
            <div className="mt-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 truncate">
              {referralLink}
            </div>
            <button
              onClick={() => copyToClipboard(referralLink, false)}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition active:scale-98"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>লিংক কপি সম্পন্ন হয়েছে!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>সম্পূর্ণ রেফার লিংক কপি করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Test Referral / Invite Friend Simulation */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                বন্ধুকে ইনভাইট করুন (টেস্ট রেফার করে ৳২৫ পান):
              </span>
            </div>
            <form onSubmit={handleInviteFriend} className="flex gap-2">
              <input
                type="text"
                placeholder="বন্ধুর নাম বা ইউজারনেম (উদা: shakib)"
                value={inviteFriendName}
                onChange={(e) => setInviteFriendName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-md"
              >
                {inviting ? 'যোগ হচ্ছে...' : 'রেফার করুন (+৳২৫)'}
              </button>
            </form>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ক্লিক করলেই নতুন রেফার যোগ হবে এবং আপনার ব্যালেন্সে সাথে সাথে ২৫ টাকা যুক্ত হবে।
            </span>
          </div>
        </div>
      </div>

      {/* Enter Friend's Referral Code Box (if not already applied) */}
      {!user?.referredBy && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  কারো রেফারেল কোড আছে কি? (Apply Friend's Code)
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                যদি কোনো বন্ধু আপনাকে ইনভাইট করে থাকে, তবে তার কোডটি এখানে বসালে সে ৳২৫ রেফারেল বোনাস পাবে।
              </p>
            </div>
            <form onSubmit={handleApplyCode} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="রেফার কোড লিখুন"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white uppercase tracking-wider font-mono outline-none w-full sm:w-40"
              />
              <button
                type="submit"
                disabled={applyingCode || !inputCode.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition whitespace-nowrap"
              >
                {applyingCode ? 'প্রয়োগ হচ্ছে...' : 'কোড সাবমিট'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Referral Income Multiplier Chart / Cards */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>রেফার ইনকাম টেবিল (যতো রেফার, ততো ইনকাম)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রতিটি ১টি রেফারের জন্য ফিক্সড ২৫ টাকা হারে আনলিমিটেড উপার্জনের হিসাব:
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>রেট: ৳২৫.০০ / প্রতি রেফার</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {earningsTiers.map((tier) => (
            <div
              key={tier.refs}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">{tier.badge}</span>
                <span className="text-[10px] text-slate-500 font-mono">x{tier.refs}</span>
              </div>
              <div className="text-xs font-bold text-slate-300 group-hover:text-white transition">
                {tier.label}
              </div>
              <div className="mt-2 text-lg font-black text-emerald-400 font-mono">
                {formatBdt(tier.earn)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">সর্বমোট রেফার (Total Referrals)</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalReferrals}</div>
          <span className="text-[11px] text-slate-400">সফলভাবে যুক্ত সদস্য</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">প্রতি রেফারে বোনাস (Rate)</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">৳২৫.০০</div>
          <span className="text-[11px] text-emerald-400">১টি রেফার = ২৫ টাকা ফিক্সড</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">মোট রেফার আয় (Total Earned)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {formatBdt(referralEarnings)}
          </div>
          <span className="text-[11px] text-slate-400">ওয়ালেটে ব্যালেন্স হিসেবে জমা</span>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">আপনার রেফার হিস্ট্রি (Referral Network)</h3>
            <p className="text-xs text-slate-400">
              আপনার কোড ব্যবহার করে জয়েন করা বন্ধুদের তালিকা ও প্রাপ্ত বোনাস:
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {history.length} টি রেফার
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">এখনো কোনো রেফার সম্পন্ন হয়নি</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              উপরে আপনার কোড কপি করুন অথবা “টেস্ট রেফার করুন” বাটনে ক্লিক করে সাথে সাথে ২৫ টাকা আয় করে দেখুন!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">আমন্ত্রিত ব্যবহারকারী</th>
                  <th className="pb-3 font-semibold">তারিখ ও সময়</th>
                  <th className="pb-3 font-semibold">স্ট্যাটাস</th>
                  <th className="pb-3 font-semibold text-right">রেফার বোনাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="text-slate-300 hover:bg-slate-950/40 transition">
                    <td className="py-3.5 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                        {item.refereeUsername.charAt(0).toUpperCase()}
                      </div>
                      <span>@{item.refereeUsername}</span>
                    </td>
                    <td className="py-3.5 text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>সফল</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                      +৳{(item.rewardBdt || 25.0).toFixed(2)}
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
