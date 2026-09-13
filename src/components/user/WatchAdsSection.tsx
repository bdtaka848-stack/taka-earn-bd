import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Advertisement } from '../../types.js';
import { useApp } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import { openAdsterraSmartlink, ADSTERRA_SMARTLINK_URL } from '../../utils/constants.js';
import {
  Tv,
  Play,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Shield,
  X,
  Flame,
  Volume2,
  VolumeX,
  TrendingUp,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WatchAdsSection: React.FC = () => {
  const { addToast, refreshUser, user } = useApp();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Limit & Progress State (500 limit, 15s, 5 BDT reward)
  const [dailyLimit, setDailyLimit] = useState(500);
  const [todayWatched, setTodayWatched] = useState(0);
  const [remaining, setRemaining] = useState(500);

  // Active watching state
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [interrupted, setInterrupted] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReward, setCompletedReward] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const claimingRef = useRef<boolean>(false);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ads/watch-list', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
        if (data.dailyLimit) setDailyLimit(data.dailyLimit);
        if (data.todayWatched !== undefined) setTodayWatched(data.todayWatched);
        if (data.remaining !== undefined) setRemaining(data.remaining);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds, user?.id]);

  const claimAdReward = useCallback(async (currentSessionId?: string) => {
    const activeSession = currentSessionId || sessionId;
    if (!activeSession || claimingRef.current) return;
    claimingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ads/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({ sessionId: activeSession }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const reward = data.rewardBdt ?? 5.0;
        setCompletedReward(reward);
        setTodayWatched((prev) => prev + 1);
        setRemaining((prev) => Math.max(0, prev - 1));
        await refreshUser();
        addToast('success', `🎉 অভিনন্দন! ১৫ সেকেন্ড বিজ্ঞাপন সম্পূর্ণ করায় +${formatBdt(reward)} মূল ব্যালেন্সে যুক্ত হয়েছে!`);
        return true;
      } else {
        setInterrupted(true);
        setInterruptionReason(data.error || 'বিজ্ঞাপন ভেরিফিকেশন ব্যর্থ হয়েছে।');
        return false;
      }
    } catch {
      setInterrupted(true);
      setInterruptionReason('সার্ভার সংযোগে ত্রুটি: রিওয়ার্ড জমা দেওয়া যায়নি।');
      return false;
    } finally {
      setIsSubmitting(false);
      claimingRef.current = false;
    }
  }, [sessionId, refreshUser, addToast]);

  const closeAdModal = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionId && !completedReward) {
      fetch('/api/ads/cancel-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    }
    setActiveAd(null);
    setSessionId(null);
    setCompletedReward(null);
    setInterrupted(false);
    startTimeRef.current = 0;
  }, [sessionId, completedReward]);

  // Handle closing modal after 15s and claiming the 5 BDT reward
  const handleCloseAndClaim = useCallback(async () => {
    if (completedReward === null && !claimingRef.current) {
      await claimAdReward();
    }
    closeAdModal();
  }, [completedReward, claimAdReward, closeAdModal]);

  // Window Focus Handler - When user returns from the Adsterra Smartlink tab
  useEffect(() => {
    if (!activeAd || completedReward !== null || interrupted) return;

    const handleWindowFocus = () => {
      if (startTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remainingTime = Math.max(0, 15 - elapsed);
        setSecondsRemaining(remainingTime);

        if (remainingTime <= 0 && !claimingRef.current && completedReward === null) {
          if (timerRef.current) clearInterval(timerRef.current);
          claimAdReward();
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [activeAd, completedReward, interrupted, claimAdReward]);

  // Timer ticker
  useEffect(() => {
    if (!activeAd || interrupted || completedReward !== null) return;

    timerRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const rem = Math.max(0, 15 - elapsed);
        setSecondsRemaining(rem);

        if (rem <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          claimAdReward();
        }
      } else {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            claimAdReward();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeAd, interrupted, completedReward, claimAdReward]);

  const startWatching = async (adToWatch?: Advertisement) => {
    const targetAd = adToWatch || ads[0] || videoCpmTask;
    if (!targetAd) {
      addToast('error', 'বর্তমানে কোনো বিজ্ঞাপন প্রস্তুত নেই।');
      return;
    }

    if (remaining <= 0) {
      addToast('error', 'আজকের ৫০০টি ভিডিও বিজ্ঞাপনের সীমা পূর্ণ হয়েছে!');
      return;
    }

    // 1. Open the Adsterra Smartlink URL in a new browser tab/window immediately
    openAdsterraSmartlink();

    // 2. Start timer state
    startTimeRef.current = Date.now();
    claimingRef.current = false;
    setInterrupted(false);
    setInterruptionReason('');
    setCompletedReward(null);
    setActiveAd(targetAd);
    const duration = targetAd.durationSeconds || 15;
    setSecondsRemaining(duration);

    try {
      const res = await fetch(`/api/ads/${targetAd.id}/start-watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });

      const data = await res.json();
      if (res.ok && data.sessionId) {
        setSessionId(data.sessionId);
      } else {
        addToast('error', data.error || 'বিজ্ঞাপন লোড করা যায়নি।');
        setActiveAd(null);
      }
    } catch {
      addToast('error', 'ভিডিও প্লেয়ার চালু করতে সমস্যা হয়েছে।');
      setActiveAd(null);
    }
  };

  // Video CPM single work item (default or from API)
  const videoCpmTask: Advertisement = ads[0] || {
    id: 'ad_video_cpm_main',
    title: 'Video CPM স্পন্সর ভিডিও অ্যাড (Watch 15s Earn ৳5)',
    provider: 'Adsterra Video CPM',
    codeSnippet: `<div class="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 rounded-2xl border border-indigo-500/40 text-center text-white shadow-xl">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3 border border-amber-500/30">
    <span>★ Video CPM High-Revenue Partner</span>
  </div>
  <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner border border-indigo-500/30">
    ▶
  </div>
  <h4 class="text-xl font-black mb-1 text-white">Adsterra Video CPM Network</h4>
  <p class="text-xs text-slate-300 max-w-md mx-auto mb-4 leading-relaxed">
    সম্পূর্ণ ১৫ সেকেন্ড ভিডিও বিজ্ঞাপনটি মনোযোগ দিয়ে দেখুন। সময় শেষ হওয়ার সাথে সাথে ৫.০০ টাকা সরাসরি আপনার মূল ব্যালেন্সে জমা হবে।
  </p>
  <div class="text-xs font-bold text-emerald-400 bg-emerald-500/15 py-1.5 px-4 rounded-xl border border-emerald-500/30 inline-block">
    ✓ নিশ্চিত আয়: ৳ ৫.০০ (প্রতি ১৫ সেকেন্ড)
  </div>
</div>`,
    placement: 'watch_ads',
    durationSeconds: 15,
    rewardBdt: 5.0,
    dailyLimit: 500,
    enabled: true,
    viewsCount: 4890,
    createdAt: '2026-08-05T00:00:00.000Z',
  };

  const progressPercent = Math.min(100, Math.round((todayWatched / dailyLimit) * 100));
  const activeAdDuration = activeAd?.durationSeconds || 15;
  const adProgressPercent = Math.round(
    ((activeAdDuration - secondsRemaining) / activeAdDuration) * 100
  );

  return (
    <div className="space-y-6">
      {/* Prominent Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-2 border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold shadow-sm">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Watch Ads · Video CPM একমাত্র নির্ধারিত কাজ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>১৫ সেকেন্ড Ad = ৫.০০ টাকা</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>দৈনিক ৫০০ টি লিমিট (Daily Limit: 500 Ads)</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Video CPM · <span className="text-indigo-400">১৫ সেকেন্ডে ৫ টাকা আয়</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Video CPM ক্যাটাগরিতে ১ ধরনের কাজ রাখা হয়েছে: প্রতিবার মাত্র ১৫ সেকেন্ড ভিডিও বিজ্ঞাপন দেখলে সাথে সাথে ৫.০০ টাকা আপনার অ্যাকাউন্টে যোগ হবে। প্রতিদিন সর্বোচ্চ ৫০০টি বিজ্ঞাপন দেখে মোট ২,৫০০ টাকা পর্যন্ত আয় করতে পারবেন।
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>আজকের লিমিট: {remaining} / {dailyLimit} টি বাকি</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>আজকে অর্জিত: {formatBdt(todayWatched * 5)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress Counter & Statistics Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                আজকের ভিডিও বিজ্ঞাপন অগ্রগতি (Daily 500 Ads Progress)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              প্রতি মধ্যরাত (১২:০০ AM) বাংলাদেশ সময় নতুন ৫০০টি বিজ্ঞাপন স্বয়ংক্রিয়ভাবে রিসেট হয়।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">সম্পন্ন বিজ্ঞাপন</div>
              <div className="text-lg font-black font-mono text-white">
                {todayWatched} <span className="text-xs text-slate-500 font-normal">/ {dailyLimit} টি</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-xs text-slate-400">অবশিষ্ট লিমিট</div>
              <div className="text-lg font-black font-mono text-indigo-400">
                {remaining} <span className="text-xs text-slate-500 font-normal">টি বাকি</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{progressPercent}% সম্পন্ন</span>
            <span>সর্বোচ্চ আয়: ৳ ২,৫০০.০০ / দিন</span>
          </div>
        </div>
      </div>

      {/* The Single Unified Work Card (১ধরনের কাজ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-950/60 shrink-0">
                <Tv className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 mb-1">
                  <span>Adsterra High-CPM Video Partner</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {videoCpmTask.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  একমাত্র নির্ধারিত কাজ · ১টি ক্লিকেই ভিডিও দেখা শুরু করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                +{formatBdt(videoCpmTask.rewardBdt || 5.0)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">প্রতি ১৫ সেকেন্ডে</span>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">বিজ্ঞাপনের সময়</div>
                <div className="text-sm font-black text-white font-mono">১৫ সেকেন্ড (15s)</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">প্রতিবারে আয়</div>
                <div className="text-sm font-black text-emerald-400 font-mono">৳ ৫.০০ BDT</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">দৈনিক লিমিট</div>
                <div className="text-sm font-black text-amber-300 font-mono">৫০০ টি কাজ</div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>কাজের সহজ নিয়মাবলী:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>নিচের বাটনে ক্লিক করে ১৫ সেকেন্ডের ভিডিও বিজ্ঞাপন চালু করুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>বিজ্ঞাপন চলাকালীন ট্যাব বন্ধ করবেন না; সম্পূর্ণ ১৫ সেকেন্ড দেখুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>১৫ সেকেন্ড শেষ হওয়া মাত্র ৫.০০ টাকা আপনার মূল ওয়ালেটে তাৎক্ষণিক যোগ হবে।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>দৈনিক ৫০০ বার এই কাজটি সম্পন্ন করে মোট ২,৫০০ টাকা পর্যন্ত নিশ্চিত আয় করুন।</span>
              </li>
            </ul>
          </div>

          {/* Main Action Button */}
          <div>
            <button
              onClick={() => startWatching(videoCpmTask)}
              disabled={loading || remaining <= 0}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition cursor-pointer ${
                remaining <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-950/80 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {remaining <= 0
                  ? 'আজকের ৫০০টি ভিডিও বিজ্ঞাপন সম্পন্ন হয়েছে'
                  : `ভিডিও অ্যাড দেখুন · ৫.০০ টাকা আয় করুন (${remaining} টি বাকি)`}
              </span>
            </button>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>আয়ের হিসাব (Earning Calc)</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১টি ভিডিও Ad (১৫s)</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫.০০</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১০টি ভিডিও Ad</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫০.০০</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১০০টি ভিডিও Ad</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫০০.০০</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex items-center justify-between">
                <span className="font-bold text-white">দৈনিক ৫০০টি Ad (পূর্ণ লিমিট)</span>
                <span className="text-base font-black text-amber-300 font-mono">৳ ২,৫০০.০০</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              ওয়ালেটে ২,০০০ টাকা জমলেই বিকাশ, নগদ বা বাইন্যান্সের (USDT) মাধ্যমে সরাসরি উইথড্র নেওয়া যাবে।
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="text-white font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ভেরিফাইড ও ১০০% নিরাপদ</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Adsterra ও গ্লোবাল হাই-সিপিএম ভিডিও বিজ্ঞাপন প্ল্যাটফর্মের সাথে সমন্বিত। কোনো অ্যাপ ইন্সটল করার ঝামেলা ছাড়াই ব্রাউজারেই বিজ্ঞাপন দেখা যায়।
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE 15-SECOND VIDEO AD PLAYER MODAL */}
      {/* ========================================================================= */}
      {activeAd && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col"
            >
              {/* Top Ad Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${secondsRemaining <= 0 || completedReward !== null ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    {secondsRemaining <= 0 || completedReward !== null ? '১৫ সেকেন্ড সম্পন্ন · [×] চাপুন' : 'Video CPM · ১৫ সেকেন্ড বিজ্ঞাপন চলছে'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড বন্ধ করুন'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* 15-Second Conditional Top [×] Close Button */}
                  {secondsRemaining > 0 && completedReward === null ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-amber-300 text-xs font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>{secondsRemaining}s পর [×] আসবে</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        onClick={handleCloseAndClaim}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-950/80 border border-emerald-300 flex items-center gap-1.5 animate-bounce cursor-pointer"
                        title="বিজ্ঞাপন কেটে ৫ টাকা নিন"
                      >
                        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-black text-sm">
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span>[ × ] কেটে ৫ টাকা নিন</span>
                      </motion.button>
                      <button
                        onClick={handleCloseAndClaim}
                        className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center font-black shadow-md border-2 border-white/60 transition cursor-pointer hover:scale-110 active:scale-95"
                        title="বিজ্ঞাপন কেটে দিন ও ৫ টাকা নিন"
                      >
                        <X className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 15-Second Done Notification Bar */}
              {(secondsRemaining <= 0 || completedReward !== null) && !interrupted && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-pulse mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>১৫ সেকেন্ড দেখা শেষ! ওপরে <strong>[×]</strong> চাপ দিয়ে ৫ টাকা গ্রহণ করে নতুন বিজ্ঞাপনে যান।</span>
                  </div>
                  <span className="font-mono text-emerald-300 font-black shrink-0 text-sm">+৳৫.০০</span>
                </div>
              )}

              {/* Countdown Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-5 border border-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                  style={{ width: `${adProgressPercent}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              {/* Status / Interrupted / Success / Running */}
              {interrupted ? (
                <div className="text-center py-6 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-5">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-rose-300 mb-1">বিজ্ঞাপন বাধাগ্রস্ত হয়েছে</h4>
                  <p className="text-xs text-slate-400 mb-4">{interruptionReason}</p>
                  <button
                    onClick={() => startWatching(activeAd)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    পুনরায় ১৫ সেকেন্ড দেখুন
                  </button>
                </div>
              ) : completedReward !== null ? (
                <div className="text-center py-6 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="w-7 h-7 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-1">🎉 রিওয়ার্ড সফলভাবে যুক্ত হয়েছে!</h4>
                  <p className="text-xs text-emerald-300 font-semibold mb-3">
                    সম্পূর্ণ ১৫ সেকেন্ড বিজ্ঞাপন দেখার জন্য আপনার মূল ওয়ালেটে জমা হয়েছে:
                  </p>
                  <div className="text-3xl font-black text-emerald-300 font-mono mb-2">
                    +{formatBdt(completedReward)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    আজকের অবশিষ্ট লিমিট: <strong className="text-white">{remaining} টি</strong> বিজ্ঞাপন
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono mb-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>টাইমার চলছে</span>
                    </div>
                    <div className="text-5xl font-black text-white font-mono tracking-tight">
                      {secondsRemaining}s
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      স্পন্সর উইন্ডোতে ১৫ সেকেন্ড ভিজিট করুন, সময় শেষে পাবেন{' '}
                      <span className="font-bold text-emerald-400 font-mono">+৳ ৫.০০</span>
                    </p>
                  </div>

                  {/* Direct Link Access Button */}
                  <a
                    href={ADSTERRA_SMARTLINK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>স্পন্সর পেজ আবার খুলুন (Adsterra Smartlink)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Advertisement Creative Render Container */}
              <div className="mb-5">
                <div
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 min-h-[140px] flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: activeAd.codeSnippet,
                  }}
                />
              </div>

              {/* Action Buttons */}
              {completedReward !== null ? (
                <div className="space-y-2">
                  <button
                    onClick={handleCloseAndClaim}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <X className="w-5 h-5 stroke-[3]" />
                    <span>[ × ] কেটে নতুন কাজে যান (অবশিষ্ট {remaining} টি)</span>
                  </button>

                  {remaining > 0 ? (
                    <button
                      onClick={() => startWatching(videoCpmTask)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>এখানেই পরবর্তী বিজ্ঞাপন চালু করুন (+৳৫.০০)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 text-center text-xs font-bold text-amber-300 border border-slate-800">
                      আজকের ৫০০টি বিজ্ঞাপন সম্পূর্ণ হয়েছে! অন্য কাজ করুন।
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {secondsRemaining <= 0 ? (
                    <button
                      onClick={handleCloseAndClaim}
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer animate-bounce"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>ব্যালেন্স জমা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 stroke-[3]" />
                          <span>[ × ] কেটে দিন এবং ৫ টাকা গ্রহণ করুন</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-slate-400 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <Shield className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                      স্পন্সর সাইট দেখুন। ১৫ সেকেন্ড পূর্ণ হলে ওপরে [×] কেটে দেওয়ার বাটন আসবে।
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
