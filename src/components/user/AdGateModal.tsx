import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Advertisement, Task } from '../../types.js';
import { useApp } from '../../context/AppContext.js';
import { ShieldCheck, AlertTriangle, Clock, X, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdGateModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: (taskToken: string) => void;
}

export const AdGateModal: React.FC<AdGateModalProps> = ({
  task,
  isOpen,
  onClose,
  onAdCompleted,
}) => {
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState<string>('');
  const [taskToken, setTaskToken] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalDuration = 10;

  const handleInterrupt = useCallback((reason: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setInterrupted(true);
    setInterruptionReason(reason);
    if (sessionId) {
      fetch('/api/tasks/cancel-ad-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    }
  }, [sessionId]);

  // Start Ad Gate Session on Mount
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setSecondsRemaining(10);
    setIsVerified(false);
    setInterrupted(false);
    setInterruptionReason('');
    setTaskToken(null);

    const initGate = async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/start-ad-gate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
          },
        });
        const data = await res.json();
        if (res.ok && mounted) {
          setAd(data.ad);
          setSessionId(data.sessionId);
          setSecondsRemaining(data.durationSeconds || 10);
          startTimeRef.current = Date.now();
          setLoading(false);
        } else if (mounted) {
          addToast('error', data.error || 'Failed to initialize ad verification gate');
          onClose();
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          addToast('error', 'Network error initializing ad gate.');
          onClose();
        }
      }
    };

    initGate();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, task.id, addToast, onClose]);

  // Anti-fraud: Tab Switch & Window Focus Detection
  useEffect(() => {
    if (!isOpen || isVerified || interrupted || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInterrupt('You navigated away or switched browser tabs during the advertisement.');
      }
    };

    const handleBlur = () => {
      // If user unfocuses or opens devtools / another app
      handleInterrupt('Browser window focus was lost or interrupted during the advertisement.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen, isVerified, interrupted, loading, handleInterrupt]);

  // 10-second countdown ticker
  useEffect(() => {
    if (!isOpen || loading || interrupted || isVerified || !sessionId) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Trigger server verification
          verifyOnServer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, loading, interrupted, isVerified, sessionId]);

  // Server-side verification call
  const verifyOnServer = async () => {
    if (!sessionId) return;
    setIsVerifying(true);

    try {
      const res = await fetch('/api/tasks/verify-ad-gate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.taskToken) {
        setIsVerified(true);
        setTaskToken(data.taskToken);
        addToast('success', '10-Second Ad Gate verified successfully! You can now start the task.');
      } else {
        handleInterrupt(data.error || 'Server rejected verification: Minimum 10 seconds was not satisfied.');
      }
    } catch {
      handleInterrupt('Server error verifying ad gate. Please restart the task.');
    } finally {
      setIsVerifying(false);
    }
  };

  const restartGate = () => {
    setInterrupted(false);
    setInterruptionReason('');
    setLoading(true);
    setSecondsRemaining(10);
    // Trigger fresh init
    fetch(`/api/tasks/${task.id}/start-ad-gate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionId) {
          setSessionId(data.sessionId);
          setAd(data.ad);
          setSecondsRemaining(data.durationSeconds || 10);
          setLoading(false);
        }
      })
      .catch(() => {
        onClose();
      });
  };

  const handleStartTaskClick = () => {
    if (isVerified && taskToken) {
      onAdCompleted(taskToken);
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - secondsRemaining) / totalDuration) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Mandatory Advertisement Gate
              </span>
            </div>
            <button
              onClick={() => {
                handleInterrupt('User closed the advertisement before timer finished.');
                onClose();
              }}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close & Cancel Task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Task Info Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 mb-5">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Preparing Task</p>
                <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-400">৳{task.rewardBdt.toFixed(2)}</span>
              </div>
            </div>

            {/* Instruction Warning */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-white mb-1">
                Please wait 10 seconds before starting the task
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Do not switch tabs, minimize, or close this window. Your ad verification is strictly validated server-side.
              </p>
            </div>

            {/* Countdown Display Card */}
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center mb-5 overflow-hidden">
              {/* Progress bar line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    interrupted
                      ? 'bg-rose-500'
                      : isVerified
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {loading ? (
                <div className="py-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Initializing secure ad stream...</span>
                </div>
              ) : interrupted ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-2">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-rose-300 mb-1">Ad Interrupted / Reset</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mb-3">
                    {interruptionReason || 'Countdown stopped because the ad was closed or interrupted.'}
                  </p>
                  <button
                    onClick={restartGate}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                  >
                    Restart 10-Second Ad
                  </button>
                </div>
              ) : isVerified ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-300 mb-0.5">Ad Gate Complete!</h4>
                  <p className="text-xs text-slate-400">Server verified 10 seconds of ad view.</p>
                </div>
              ) : isVerifying ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-2" />
                  <span className="text-xs text-emerald-400 font-semibold">Verifying on Server...</span>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono mb-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Countdown</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                    {secondsRemaining}s
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Please keep this window active</p>
                </div>
              )}
            </div>

            {/* ADVERTISEMENT CONTAINER (Sanitized HTML Preview) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Configured Sponsor Advertisement
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {ad?.provider || 'Adsterra / Partner Network'}
                </span>
              </div>
              <div
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 min-h-[120px] flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html:
                    ad?.codeSnippet ||
                    `<div class="text-center text-xs text-slate-400">Adsterra Smart Direct Link Ad Rendering...</div>`,
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleInterrupt('Cancelled by user');
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition text-center"
              >
                Cancel Task
              </button>

              <button
                type="button"
                disabled={!isVerified || isVerifying}
                onClick={handleStartTaskClick}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                  isVerified
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-950/60 cursor-pointer animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Start Task Now</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Locked ({secondsRemaining}s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
