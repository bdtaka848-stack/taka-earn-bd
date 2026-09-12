import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import { SpinSlice, Advertisement } from '../../types.js';
import {
  Sparkles,
  Trophy,
  RotateCw,
  CheckCircle2,
  Gift,
  Clock,
  ExternalLink,
  ShieldCheck,
  Play,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SpinWheelSection: React.FC = () => {
  const { addToast, refreshUser, user } = useApp();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(500);
  const [spinsRemaining, setSpinsRemaining] = useState(500);
  const [slices, setSlices] = useState<SpinSlice[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [lastWin, setLastWin] = useState<{ rewardBdt: number; sliceLabel: string } | null>(null);

  // 15-Second Ad Break Settings & State
  const [requireAdBetweenSpins, setRequireAdBetweenSpins] = useState(true);
  const [adDurationSeconds, setAdDurationSeconds] = useState(15);
  const [sponsorAd, setSponsorAd] = useState<Advertisement | null>(null);

  // Active Ad Modal State
  const [showAdModal, setShowAdModal] = useState(false);
  const [adSecondsRemaining, setAdSecondsRemaining] = useState(15);
  const [adCompleted, setAdCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const adTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/spin/status', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
        setDailyLimit(data.dailyLimit || 500);
        setSpinsRemaining(data.spinsRemaining);
        setSlices(data.slices || []);
        if (data.requireAdBetweenSpins !== undefined) {
          setRequireAdBetweenSpins(data.requireAdBetweenSpins);
        }
        if (data.adDurationSeconds) {
          setAdDurationSeconds(data.adDurationSeconds);
        }
        if (data.ad) {
          setSponsorAd(data.ad);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [user?.id]);

  // Start the 15-second sponsor ad breakdown
  const startAdBreak = useCallback((duration: number = 15) => {
    if (adTimerRef.current) {
      clearInterval(adTimerRef.current);
    }
    setAdSecondsRemaining(duration);
    setAdCompleted(false);
    setShowAdModal(true);

    adTimerRef.current = setInterval(() => {
      setAdSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (adTimerRef.current) {
            clearInterval(adTimerRef.current);
            adTimerRef.current = null;
          }
          setAdCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleCloseAdModal = () => {
    if (!adCompleted) {
      addToast('error', 'পরবর্তী স্পিন আনলক করতে সম্পূর্ণ ১৫ সেকেন্ড বিজ্ঞাপনটি দেখুন।');
      return;
    }
    if (adTimerRef.current) {
      clearInterval(adTimerRef.current);
    }
    setShowAdModal(false);
    addToast('success', 'বিজ্ঞাপন সম্পন্ন হয়েছে! আপনি এখন পরবর্তী স্পিন করতে পারবেন।');
  };

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining <= 0 || !enabled || showAdModal) return;

    setIsSpinning(true);
    setLastWin(null);

    try {
      const res = await fetch('/api/spin/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const sliceCount = slices.length || 6;
        const targetIndex = data.sliceIndex ?? 0;
        const sliceAngle = 360 / sliceCount;

        // Calculate angle to land on targetIndex under the top needle (270 degrees)
        const segmentCenter = targetIndex * sliceAngle + sliceAngle / 2;
        const currentMod = rotationDegrees % 360;
        const extraTurns = 360 * 6; // 6 full revolutions for dramatic effect
        const targetRotation = rotationDegrees + extraTurns + (360 - currentMod) - segmentCenter;

        setRotationDegrees(targetRotation);

        // Wait for wheel animation to finish (4.5s)
        setTimeout(async () => {
          setIsSpinning(false);
          setLastWin({
            rewardBdt: data.rewardBdt,
            sliceLabel: data.sliceLabel,
          });
          setSpinsRemaining((prev) => Math.max(0, prev - 1));
          await refreshUser();
          addToast('success', `🎉 অভিনন্দন! স্পিনে জিতেছেন +${formatBdt(data.rewardBdt)}`);

          // Trigger the 15-second sponsor ad break if enabled
          if (requireAdBetweenSpins) {
            setTimeout(() => {
              startAdBreak(adDurationSeconds || 15);
            }, 1200);
          }
        }, 4600);
      } else {
        setIsSpinning(false);
        addToast('error', data.error || 'স্পিন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch {
      setIsSpinning(false);
      addToast('error', 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।');
    }
  };

  // Render SVG Slices
  const renderWheel = () => {
    if (slices.length === 0) return null;
    const numSlices = slices.length;
    const sliceAngle = 360 / numSlices;
    const radius = 160;
    const center = 170;

    return (
      <svg
        viewBox="0 0 340 340"
        className="w-full h-full transform transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
        style={{
          transform: `rotate(${rotationDegrees}deg)`,
          transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
        }}
      >
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle cx={center} cy={center} r={radius + 6} fill="#0f172a" stroke="#334155" strokeWidth="4" />

        {slices.map((slice, i) => {
          const startAngle = (i * sliceAngle * Math.PI) / 180;
          const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;

          const x1 = center + radius * Math.sin(startAngle);
          const y1 = center - radius * Math.cos(startAngle);
          const x2 = center + radius * Math.sin(endAngle);
          const y2 = center - radius * Math.cos(endAngle);

          const midAngle = ((i + 0.5) * sliceAngle * Math.PI) / 180;
          const textRadius = radius * 0.65;
          const tx = center + textRadius * Math.sin(midAngle);
          const ty = center - textRadius * Math.cos(midAngle);
          const textRotation = (i + 0.5) * sliceAngle;

          return (
            <g key={i}>
              <path
                d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                fill={slice.color}
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              <text
                x={tx}
                y={ty}
                fill={slice.textColor || '#ffffff'}
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                className="font-mono tracking-tight select-none"
              >
                {slice.label}
              </text>
            </g>
          );
        })}

        {/* Outer Dots */}
        {slices.map((_, i) => {
          const angle = ((i * sliceAngle + sliceAngle / 2) * Math.PI) / 180;
          const dotR = radius + 1;
          const dx = center + dotR * Math.sin(angle);
          const dy = center - dotR * Math.cos(angle);
          return (
            <circle
              key={`dot-${i}`}
              cx={dx}
              cy={dy}
              r="3.5"
              fill="#fbbf24"
              stroke="#0f172a"
              strokeWidth="1"
            />
          );
        })}

        {/* Center Hub */}
        <circle cx={center} cy={center} r="38" fill="#0f172a" stroke="#475569" strokeWidth="4" />
        <circle cx={center} cy={center} r="28" fill="#1e293b" />
        <text
          x={center}
          y={center}
          fill="#10b981"
          fontSize="16"
          fontWeight="black"
          textAnchor="middle"
          dominantBaseline="central"
        >
          ৳
        </text>
      </svg>
    );
  };

  const adPercentage = Math.round(
    ((adDurationSeconds - adSecondsRemaining) / adDurationSeconds) * 100
  );

  return (
    <div className="space-y-6">
      {/* Prominent Header Banner with 500 Daily Limit & 15s Ad Option */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>প্রতি দিন ৫০০ বার স্পিন লিমিট (500 Daily Spins Limit)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>১ Spin পর পর ১৫ সেকেন্ড Ad বিরতি</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            লাকি স্পিন হুইল · <span className="text-purple-400">প্রতিদিন ৫০০ বার স্পিন</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            প্রতিদিন ৫০০ বার পর্যন্ত স্পিন করে জিতে নিন আকর্ষণীয় ক্যাশ রিওয়ার্ড (সর্বোচ্চ ৳১০০ পর্যন্ত)।
            প্রতি ১টি স্পিন ঘোরানোর পর ১৫ সেকেন্ডের স্পন্সর বিজ্ঞাপন দেখানো হবে এবং সাথে সাথে পরবর্তী স্পিন আনলক হবে।
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-xs font-semibold text-purple-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-400" />
              <span>আজকের অবশিষ্ট: {spinsRemaining} / {dailyLimit} বার</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ইনস্ট্যান্ট ওয়ালেট ক্যাশ যোগ</span>
            </div>
            <button
              onClick={() => startAdBreak(adDurationSeconds)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>টেস্ট ১৫ সেকেন্ড Ad দেখুন</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Wheel Canvas Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Daily Limit Tracker Pill */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-300">
                দৈনিক ৫০০ স্পিন একটিভ
              </span>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {spinsRemaining} / {dailyLimit} বাকি
            </span>
          </div>

          {/* Top Indicator Needle */}
          <div className="relative z-20 flex flex-col items-center -mb-4">
            <div className="w-6 h-8 bg-gradient-to-b from-amber-400 to-amber-500 rounded-b-full shadow-lg shadow-amber-950 flex items-center justify-center border-2 border-slate-900">
              <div className="w-2 h-2 rounded-full bg-slate-950" />
            </div>
          </div>

          {/* Wheel Frame Container */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center p-2 rounded-full bg-slate-950/80 border-4 border-slate-800 shadow-2xl">
            {renderWheel()}
          </div>

          {/* Controls */}
          <div className="mt-8 text-center w-full max-w-sm space-y-3">
            <button
              onClick={handleSpin}
              disabled={isSpinning || spinsRemaining <= 0 || !enabled || showAdModal}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                isSpinning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : showAdModal
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 cursor-wait'
                  : spinsRemaining <= 0 || !enabled
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-purple-950/60 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? 'চাকা ঘুরছে... (Spinning)'
                  : showAdModal
                  ? `১৫ সেকেন্ড বিজ্ঞাপন চলছে (${adSecondsRemaining}s)`
                  : spinsRemaining <= 0
                  ? 'আজকের ৫০০ স্পিন সীমা পূর্ণ হয়েছে'
                  : `স্পিন করুন (${spinsRemaining} বার বাকি)`}
              </span>
            </button>

            {/* Ad Feature Notice */}
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 text-left">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>প্রতি ১ স্পিনের পর ১৫ সেকেন্ড স্পন্সর বিজ্ঞাপন</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                ১৫ সেকেন্ড Ad
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              দৈনিক ৫০০ বার স্পিন লিমিট প্রতি মধ্যরাতে (বাংলাদেশ সময়) স্বয়ংক্রিয়ভাবে রিসেট হয়।
            </p>
          </div>
        </div>

        {/* Rewards & Probability Stats */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  পুরস্কার ও সম্ভাবনা তালিকা
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">১০০% ভেরিফাইড প্রবেবিলিটি</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                {spinsRemaining}/{dailyLimit} স্পিন
              </span>
            </div>

            <div className="space-y-2.5">
              {slices.map((slice, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-xs font-bold text-white">{slice.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{formatBdt(slice.rewardBdt)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {slice.probability}% সম্ভাবনা
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winning Pop-up Card if won */}
          {lastWin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 text-center shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                🎉 আপনি জিতেছেন {lastWin.sliceLabel}!
              </h4>
              <p className="text-xs text-emerald-300 font-semibold mb-2">
                +{formatBdt(lastWin.rewardBdt)} আপনার ওয়ালেটে সাথে সাথে যুক্ত হয়েছে।
              </p>
              {requireAdBetweenSpins && !showAdModal && (
                <span className="text-[11px] text-slate-400 block">
                  পরবর্তী স্পিনের জন্য ১৫ সেকেন্ড বিজ্ঞাপন প্রস্তুত হচ্ছে...
                </span>
              )}
            </motion.div>
          )}

          {/* Ad Rule Clarification Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>স্পিন ও বিজ্ঞাপন নিয়মাবলী</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
              <li>ব্যবহারকারী প্রতিদিন সর্বোচ্চ <strong className="text-white font-semibold">৫০০ বার</strong> স্পিন করতে পারবেন।</li>
              <li>প্রতি <strong className="text-white font-semibold">১ স্পিনের পর ১৫ সেকেন্ড</strong> স্পন্সর বিজ্ঞাপন স্বয়ংক্রিয়ভাবে চালু হবে।</li>
              <li>বিজ্ঞাপন সম্পূর্ণ ১৫ সেকেন্ড দেখার সাথে সাথে পরবর্তী স্পিন আনলক হয়ে যাবে।</li>
              <li>যেকোনো সময় জিতে নেওয়া টাকা সরাসরি বিকাশ, নগদ বা বাইন্যান্সে উইথড্র করা যাবে।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 15-SECOND SPONSOR AD MODAL / BREAK (১ স্পিন পর পর ১৫ সেকেন্ড Ad অপশন) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Top Ad Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>স্পন্সর বিজ্ঞাপন (Sponsor Ad)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        ১ Spin বিরতি
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ১৫ সেকেন্ড বিজ্ঞাপন দেখার পর পরবর্তী স্পিন আনলক হবে
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full bg-slate-950 h-2 relative overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500"
                  style={{ width: `${adPercentage}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              {/* Ad Creative & Video Container */}
              <div className="p-6 space-y-5">
                {/* Large Visual Timer Display */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      {adCompleted ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-3 border-amber-500 border-t-transparent animate-spin flex items-center justify-center" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {adCompleted
                          ? 'বিজ্ঞাপন দেখা সম্পন্ন হয়েছে!'
                          : 'বিজ্ঞাপন চলছে, অনুগ্রহ করে অপেক্ষা করুন...'}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {adCompleted
                          ? 'পরবর্তী স্পিন বাটন সক্রিয় হয়েছে'
                          : '১ স্পিন পর পর ১৫ সেকেন্ড বিজ্ঞাপন বাধ্যতামূলক'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {adSecondsRemaining > 0 ? `${adSecondsRemaining}s` : 'OK'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">অবশিষ্ট সময়</span>
                  </div>
                </div>

                {/* Simulated / Real High-CPM Sponsor Creative */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-purple-950/50 p-5 text-center shadow-inner">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 mb-3">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Adsterra High-CPM Verified Partner</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white tracking-tight mb-2">
                    {sponsorAd?.title || 'Mega Cloud Earning & Premium Reward Network'}
                  </h4>

                  <p className="text-xs text-slate-300 max-w-sm mx-auto mb-4 leading-relaxed">
                    প্রতিদিন হাজার হাজার ব্যবহারকারী এই অফার থেকে অতিরিক্ত আয় করছেন। ইনস্ট্যান্ট বিকাশ ক্যাশআউট ও এক্সক্লুসিভ রিওয়ার্ড লুফে নিন।
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <a
                      href="https://t.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <span>অফারটি ঘুরে দেখুন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Next Spin Unlock Action Button */}
                <div>
                  {adCompleted ? (
                    <button
                      onClick={handleCloseAdModal}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition animate-bounce cursor-pointer"
                    >
                      <RotateCw className="w-5 h-5" />
                      <span>পরবর্তী স্পিন করুন (Start Next Spin)</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 px-6 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-700/50"
                    >
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>
                        বিজ্ঞাপন সমাপ্ত হতে {adSecondsRemaining} সেকেন্ড অপেক্ষা করুন...
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
