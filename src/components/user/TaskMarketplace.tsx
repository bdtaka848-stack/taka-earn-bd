import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import { openAdsterraSmartlink, ADSTERRA_SMARTLINK_URL } from '../../utils/constants.js';
import {
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  TrendingUp,
  Play,
  RotateCw,
  Plus,
  ExternalLink,
  X,
  Award,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MathTaskStatus {
  dailyLimit: number;
  todayCompleted: number;
  remaining: number;
  rewardBdt: number;
  adDurationSeconds: number;
  smartlinkUrl: string;
}

interface SolvedHistoryItem {
  id: string;
  expression: string;
  answer: number;
  reward: number;
  timestamp: string;
}

export const TaskMarketplace: React.FC = () => {
  const { user, refreshUser, addToast } = useApp();

  const [status, setStatus] = useState<MathTaskStatus>({
    dailyLimit: 500,
    todayCompleted: 0,
    remaining: 500,
    rewardBdt: 5.0,
    adDurationSeconds: 15,
    smartlinkUrl: ADSTERRA_SMARTLINK_URL,
  });
  const [loading, setLoading] = useState(true);

  // Math Problem State
  const [num1, setNum1] = useState(15);
  const [num2, setNum2] = useState(8);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 15-Second Sponsor Modal State
  const [activeSponsorModal, setActiveSponsorModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReward, setCompletedReward] = useState<number | null>(null);
  const [solvedHistory, setSolvedHistory] = useState<SolvedHistoryItem[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isClaimingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Generate a friendly, simple addition problem
  const generateNewProblem = useCallback(() => {
    // Simple additions with numbers like 7 to 35
    const n1 = Math.floor(Math.random() * 28) + 6;
    const n2 = Math.floor(Math.random() * 22) + 3;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setErrorMessage('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Fetch initial math status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks/math-status', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data: MathTaskStatus = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch math task status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    generateNewProblem();
  }, [fetchStatus, generateNewProblem]);

  // Submit and claim reward after 15 seconds
  const submitRewardClaim = useCallback(
    async (mathAns: number, expectedAns: number) => {
      if (isClaimingRef.current) return;
      isClaimingRef.current = true;
      setIsSubmitting(true);

      try {
        const res = await fetch('/api/tasks/math-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
          },
          body: JSON.stringify({
            mathAnswer: mathAns,
            expectedAnswer: expectedAns,
            elapsedSeconds: 15,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const reward = data.rewardBdt ?? 5.0;
          setCompletedReward(reward);
          setStatus((prev) => ({
            ...prev,
            todayCompleted: prev.todayCompleted + 1,
            remaining: Math.max(0, prev.remaining - 1),
          }));

          // Add to local solved history
          setSolvedHistory((prev) => [
            {
              id: `math_${Date.now()}`,
              expression: `${num1} + ${num2}`,
              answer: mathAns,
              reward,
              timestamp: new Date().toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            },
            ...prev.slice(0, 9),
          ]);

          // Update user balance across the application immediately
          await refreshUser();
          addToast('success', `🎉 অভিনন্দন! সঠিক অংক এবং ১৫ সেকেন্ড সম্পূর্ণ করায় +${formatBdt(reward)} যুক্ত হয়েছে!`);
        } else {
          setErrorMessage(data.error || 'রিওয়ার্ড সংগ্রহে ত্রুটি হয়েছে।');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('সার্ভার এরর: রিওয়ার্ড প্রসেস করা যায়নি।');
      } finally {
        setIsSubmitting(false);
        isClaimingRef.current = false;
      }
    },
    [num1, num2, refreshUser, addToast]
  );

  // Return to window focus handler
  useEffect(() => {
    if (!activeSponsorModal || completedReward !== null) return;

    const handleWindowFocus = () => {
      if (startTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const rem = Math.max(0, 15 - elapsed);
        setSecondsRemaining(rem);

        if (rem <= 0 && !isClaimingRef.current && !completedReward) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitRewardClaim(Number(userAnswer), num1 + num2);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [activeSponsorModal, completedReward, userAnswer, num1, num2, submitRewardClaim]);

  // Interval timer for 15s countdown
  useEffect(() => {
    if (!activeSponsorModal || completedReward !== null) return;

    timerRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const rem = Math.max(0, 15 - elapsed);
        setSecondsRemaining(rem);

        if (rem <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitRewardClaim(Number(userAnswer), num1 + num2);
        }
      } else {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitRewardClaim(Number(userAnswer), num1 + num2);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSponsorModal, completedReward, userAnswer, num1, num2, submitRewardClaim]);

  // Handle Math Submission
  const handleSolveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (status.remaining <= 0) {
      addToast('error', 'আজকের ৫০০টি অংক কাজের সীমা পূর্ণ হয়েছে। আগামীকাল আবার আসুন!');
      return;
    }

    if (!userAnswer.trim()) {
      setErrorMessage('দয়া করে যোগফলের উত্তরটি লিখুন।');
      return;
    }

    const expected = num1 + num2;
    const parsed = Number(userAnswer.trim());

    if (isNaN(parsed) || parsed !== expected) {
      setErrorMessage(`ভুল উত্তর! ${num1} + ${num2} এর সঠিক যোগফল লিখুন।`);
      return;
    }

    // Correct answer! Launch Adsterra Smartlink & 15-second sponsor countdown
    openAdsterraSmartlink();
    startTimeRef.current = Date.now();
    isClaimingRef.current = false;
    setSecondsRemaining(15);
    setCompletedReward(null);
    setActiveSponsorModal(true);
  };

  const handleNextProblem = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSponsorModal(false);
    setCompletedReward(null);
    startTimeRef.current = 0;
    generateNewProblem();
  }, [generateNewProblem]);

  // Close ad modal, claim 5 BDT reward if not yet claimed, and open next problem
  const handleCloseAndClaim = useCallback(async () => {
    if (completedReward === null && !isClaimingRef.current) {
      await submitRewardClaim(Number(userAnswer), num1 + num2);
    }
    handleNextProblem();
  }, [completedReward, submitRewardClaim, userAnswer, num1, num2, handleNextProblem]);

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setUserAnswer('');
    } else if (val === 'BACK') {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else {
      if (userAnswer.length < 5) {
        setUserAnswer((prev) => prev + val);
      }
    }
  };

  const progressPercent = Math.min(100, Math.round((status.todayCompleted / status.dailyLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border-2 border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tasks · সহজ যোগ অংক কাজ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>প্রতি অংকে ৫.০০ টাকা</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>১৫ সেকেন্ড অ্যাড বিরতি</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            সহজ যোগ অংক সমাধান করুন এবং ইনকাম করুন
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            কোনো জটিলতা ছাড়াই শুধু সহজ সহজ যোগ (+) অংক করুন। প্রতিটি সঠিক অংকের পর ১৫ সেকেন্ড স্পন্সর দেখুন এবং সাথে সাথে ওয়ালেটে ৫.০০ টাকা পেয়ে যান! দৈনিক ৫০০টি পর্যন্ত অংক করার সুযোগ রয়েছে।
          </p>

          {/* Daily Limit & Progress Bar */}
          <div className="pt-2 space-y-2 max-w-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                আজকের সম্পন্ন অংক: <strong className="text-emerald-400 font-mono">{status.todayCompleted}</strong> / {status.dailyLimit} টি
              </span>
              <span className="text-amber-300 font-bold font-mono">
                অবশিষ্ট: {status.remaining} টি বাকি
              </span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Math Solver Card & Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Math Workspace */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner">
                  +
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">অংক সমাধান করুন</h3>
                  <p className="text-xs text-slate-400">সঠিক সংখ্যা লিখুন ও উত্তর সাবমিট করুন</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">+৳৫.০০</span>
                <div className="text-[10px] text-slate-400 uppercase font-bold">প্রতি অংকে</div>
              </div>
            </div>

            {/* Visual Math Addition Problem Display */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-center gap-3 sm:gap-6 text-3xl sm:text-5xl font-black font-mono">
                {/* Number 1 */}
                <div className="px-5 sm:px-8 py-3 sm:py-5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white shadow-md">
                  {num1}
                </div>

                {/* Plus Sign */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl sm:text-3xl border border-emerald-500/30">
                  +
                </div>

                {/* Number 2 */}
                <div className="px-5 sm:px-8 py-3 sm:py-5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white shadow-md">
                  {num2}
                </div>

                {/* Equal Sign */}
                <div className="text-slate-500 font-sans">=</div>

                {/* Question / Target */}
                <div className="px-4 sm:px-6 py-3 sm:py-5 rounded-2xl bg-emerald-950/40 border-2 border-dashed border-emerald-500/60 text-emerald-300 font-bold min-w-[70px] sm:min-w-[90px]">
                  {userAnswer || '?'}
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                প্রশ্ন: {num1} এবং {num2} যোগ করলে কত হয়?
              </p>
            </div>

            {/* Answer Input & Submit Form */}
            <form onSubmit={handleSolveSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  আপনার উত্তর লিখুন:
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="এখানে সঠিক যোগফলটি লিখুন..."
                    disabled={status.remaining <= 0}
                    className="w-full py-4 px-5 text-xl sm:text-2xl font-bold font-mono rounded-2xl bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder:text-slate-600 transition"
                  />
                  {userAnswer && (
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {errorMessage && (
                  <p className="text-xs font-bold text-rose-400 animate-shake flex items-center gap-1.5 mt-1">
                    <span>⚠</span>
                    <span>{errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Quick Number Keypad for Mobile Convenience */}
              <div className="grid grid-cols-6 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono font-bold text-base transition cursor-pointer active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('BACK')}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs transition cursor-pointer active:scale-95"
                  title="মুছুন"
                >
                  ← মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer active:scale-95"
                  title="সব ক্লিয়ার"
                >
                  Clear
                </button>
              </div>

              {/* Primary Action Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={status.remaining <= 0}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition cursor-pointer ${
                    status.remaining <= 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/80 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {status.remaining <= 0
                      ? 'আজকের ৫০০টি অংক সম্পন্ন হয়েছে'
                      : `উত্তর জমা দিন ও ৳৫.০০ নিন (${status.remaining}টি বাকি)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={generateNewProblem}
                  className="py-4 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>অন্য অংক আনুন</span>
                </button>
              </div>
            </form>
          </div>

          {/* Solved History in this Session */}
          {solvedHistory.length > 0 && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>সাম্প্রতিক সম্পন্ন অংক সমূহ</span>
                </div>
                <span className="text-emerald-400 font-mono">+{formatBdt(solvedHistory.length * 5)} আয়</span>
              </div>

              <div className="space-y-2">
                {solvedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-mono font-bold text-white">{item.expression} = {item.answer}</span>
                      <span className="text-[10px] text-slate-500">({item.timestamp})</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">+{formatBdt(item.reward)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Earnings Breakdown & Instructions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>অংক কাজের আয়ের হিসাব</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১টি অংক (১৫s স্পন্সর)</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫.০০</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১০টি অংক</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫০.০০</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">১০০টি অংক</span>
                <span className="font-bold text-emerald-400 font-mono">৳ ৫০০.০০</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 flex items-center justify-between">
                <span className="font-bold text-white">দৈনিক ৫০০টি অংক (পূর্ণ লিমিট)</span>
                <span className="text-base font-black text-amber-300 font-mono">৳ ২,৫০০.০০</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              ওয়ালেটে ২,০০০ টাকা জমলেই বিকাশ, নগদ বা বাইন্যান্সের (USDT) মাধ্যমে সরাসরি উইথড্র করা যাবে।
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-3">
            <div className="text-white font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>অংক কাজের নিয়মাবলী:</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                <span>প্রদত্ত সহজ দুটি সংখ্যার যোগফল নির্ণয় করে ঘরে লিখুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                <span>'উত্তর জমা দিন' চাপলে স্পন্সর পেজটি স্বয়ংক্রিয়ভাবে ওপেন হবে।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
                <span>১৫ সেকেন্ড পর অ্যাপে ফিরলে সরাসরি আপনার অ্যাকাউন্টে ৫.০০ টাকা যোগ হবে।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">4</span>
                <span>প্রতিদিন ৫০০টি পর্যন্ত অংক করে সর্বোচ্চ ২,৫০০ টাকা আয় করুন।</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 15-SECOND ADSTERRA SMARTLINK SPONSOR MODAL */}
      {/* ========================================================================= */}
      {activeSponsorModal && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${secondsRemaining <= 0 || completedReward !== null ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {secondsRemaining <= 0 || completedReward !== null ? '১৫ সেকেন্ড সম্পন্ন · [×] চাপুন' : 'Math Task · ১৫ সেকেন্ড স্পন্সর বিরতি'}
                  </span>
                </div>

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

              {/* 15-Second Done Notification Bar */}
              {(secondsRemaining <= 0 || completedReward !== null) && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-pulse mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>১৫ সেকেন্ড সম্পন্ন! ওপরে <strong>[×]</strong> চাপ দিয়ে ৫ টাকা গ্রহণ করে পরবর্তী অংক শুরু করুন।</span>
                  </div>
                  <span className="font-mono text-emerald-300 font-black shrink-0 text-sm">+৳৫.০০</span>
                </div>
              )}

              {/* Countdown Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-5 border border-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${Math.round(((15 - secondsRemaining) / 15) * 100)}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              {/* Success / Countdown Card */}
              {completedReward !== null ? (
                <div className="text-center py-6 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="w-7 h-7 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-1">🎉 অংক সফল হয়েছে ও রিওয়ার্ড যুক্ত হয়েছে!</h4>
                  <p className="text-xs text-emerald-300 font-semibold mb-3">
                    সঠিক উত্তর ({num1} + {num2} = {num1 + num2}) ও ১৫ সেকেন্ড সম্পূর্ণ করায় জমা হয়েছে:
                  </p>
                  <div className="text-3xl font-black text-emerald-300 font-mono mb-2">
                    +{formatBdt(completedReward)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    আজকের অবশিষ্ট লিমিট: <strong className="text-white">{status.remaining} টি</strong> অংক
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono mb-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
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

                  {/* Direct Smartlink Button */}
                  <a
                    href={ADSTERRA_SMARTLINK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>স্পন্সর অফার পেইজ আবার খুলুন (Adsterra Smartlink)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              {completedReward !== null ? (
                <div className="space-y-2">
                  <button
                    onClick={handleCloseAndClaim}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <X className="w-5 h-5 stroke-[3]" />
                    <span>[ × ] কেটে পরবর্তী অংক শুরু করুন (অবশিষ্ট {status.remaining} টি)</span>
                  </button>

                  {status.remaining > 0 ? (
                    <button
                      onClick={handleCloseAndClaim}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>নতুন অংক পেইজে যান (+৳৫.০০)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 text-center text-xs font-bold text-amber-300 border border-slate-800">
                      আজকের ৫০০টি অংক কাজ সম্পূর্ণ হয়েছে! অন্য কাজ করুন।
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
                      স্পন্সর উইন্ডো দেখুন। ১৫ সেকেন্ড পূর্ণ হলে ওপরে [×] কেটে দেওয়ার বাটন আসবে।
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
