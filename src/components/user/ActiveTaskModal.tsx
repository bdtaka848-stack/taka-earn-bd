import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types.js';
import { useApp } from '../../context/AppContext.js';
import { Clock, CheckCircle2, AlertTriangle, Sparkles, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatBdt } from '../../utils/format.js';

interface ActiveTaskModalProps {
  task: Task;
  taskToken: string;
  isOpen: boolean;
  onClose: () => void;
  onCompletedSuccess: () => void;
}

export const ActiveTaskModal: React.FC<ActiveTaskModalProps> = ({
  task,
  taskToken,
  isOpen,
  onClose,
  onCompletedSuccess,
}) => {
  const { addToast, refreshUser } = useApp();

  const [secondsRemaining, setSecondsRemaining] = useState(task.durationSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalSeconds = task.durationSeconds;

  useEffect(() => {
    if (!isOpen) return;

    setSecondsRemaining(task.durationSeconds);
    setCompleted(false);
    setRewardClaimed(null);
    setError(null);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinishTask();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, task.durationSeconds]);

  const handleFinishTask = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
        body: JSON.stringify({ taskToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompleted(true);
        setRewardClaimed(data.rewardBdt);
        await refreshUser();
        addToast('success', `Task completed! ${formatBdt(data.rewardBdt)} credited to your wallet.`);
        onCompletedSuccess();
      } else {
        setError(data.error || 'Server could not verify task completion.');
      }
    } catch {
      setError('Network connection error completing task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Active Task Execution
              </span>
            </div>
            {!completed && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit this task? Progress will be lost.')) {
                    onClose();
                  }
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-1.5">{task.title}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Timer State */}
          {completed ? (
            <div className="py-6 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50">
                <Sparkles className="w-7 h-7 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Congratulations!</h4>
              <p className="text-xs text-emerald-300 mb-3">
                Task successfully verified and reward sent to your wallet.
              </p>
              <div className="inline-block py-2 px-5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-2xl font-black text-emerald-300 font-mono">
                +{formatBdt(rewardClaimed || task.rewardBdt)}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center mb-6 relative overflow-hidden">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono mb-3">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Task Remaining Time</span>
              </div>

              <div className="text-5xl font-black text-white font-mono tracking-tight mb-2">
                {secondsRemaining}s
              </div>

              <p className="text-xs text-slate-400">
                Reward: <span className="font-bold text-emerald-400">{formatBdt(task.rewardBdt)}</span> upon timer completion
              </p>

              {isSubmitting && (
                <div className="mt-3 text-xs text-emerald-400 font-medium flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span>Submitting server verification & crediting wallet...</span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {completed ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition"
            >
              Done & Return to Tasks
            </button>
          ) : (
            <div className="text-center text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 inline mr-1 text-slate-400" />
              Keep this window open until countdown finishes to claim your reward.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
