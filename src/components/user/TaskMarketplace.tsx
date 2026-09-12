import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskCategory } from '../../types.js';
import { useApp } from '../../context/AppContext.js';
import { formatBdt } from '../../utils/format.js';
import { AdGateModal } from './AdGateModal.js';
import { ActiveTaskModal } from './ActiveTaskModal.js';
import {
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Lock,
  Play,
  RotateCcw,
  Youtube,
  Smartphone,
  BookOpen,
  CheckSquare,
  Calendar,
  Send,
  HelpCircle,
} from 'lucide-react';

export const TaskMarketplace: React.FC = () => {
  const { user } = useApp();
  const [tasks, setTasks] = useState<Array<Task & { userCompleted?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Ad gate & active task state
  const [adGateTask, setAdGateTask] = useState<Task | null>(null);
  const [activeTaskRunner, setActiveTaskRunner] = useState<{ task: Task; token: string } | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks', {
        headers: {
          'x-user-id': localStorage.getItem('taskbdt_current_user_id') || 'usr_demo_1',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, user?.id]);

  const categories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'social', label: 'Social Media' },
    { id: 'app_install', label: 'App Installs' },
    { id: 'survey', label: 'Surveys' },
    { id: 'read', label: 'Articles' },
    { id: 'daily', label: 'Daily Bonus' },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const getTaskIcon = (category: string, title: string) => {
    if (title.toLowerCase().includes('youtube')) return <Youtube className="w-5 h-5 text-red-400" />;
    if (category === 'app_install') return <Smartphone className="w-5 h-5 text-cyan-400" />;
    if (category === 'read') return <BookOpen className="w-5 h-5 text-amber-400" />;
    if (category === 'survey') return <CheckSquare className="w-5 h-5 text-indigo-400" />;
    if (category === 'daily') return <Calendar className="w-5 h-5 text-emerald-400" />;
    if (title.toLowerCase().includes('telegram')) return <Send className="w-5 h-5 text-sky-400" />;
    return <Sparkles className="w-5 h-5 text-teal-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Anti-Fraud Protected &middot; 10s Verified Ad Gate</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Task Marketplace
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Complete quick verified tasks, watch sponsor ads, and earn instant BDT (৳) directly into your wallet. Every task requires a complete 10-second advertisement verification before starting.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900 border border-slate-800">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">No tasks in this category</h4>
          <p className="text-xs text-slate-400">Check other categories or check back soon for new offers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.userCompleted && !task.isRepeatable;

            return (
              <div
                key={task.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 shadow-lg transition-all group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                      {getTaskIcon(task.category, task.title)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        10s Ad Gate
                      </span>
                      {task.isRepeatable && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300">
                          Repeatable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-emerald-400 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {task.description}
                  </p>
                </div>

                <div>
                  {/* Meta Specs */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-800/80 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{task.durationSeconds}s duration</span>
                    </div>
                    <div className="font-bold text-emerald-400 text-sm font-mono">
                      {formatBdt(task.rewardBdt)}
                    </div>
                  </div>

                  {/* Start Button */}
                  {isCompleted ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdGateTask(task)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch 10s Ad & Start Task</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ad Gate Modal */}
      {adGateTask && (
        <AdGateModal
          task={adGateTask}
          isOpen={!!adGateTask}
          onClose={() => setAdGateTask(null)}
          onAdCompleted={(taskToken) => {
            const currentTask = adGateTask;
            setAdGateTask(null);
            setActiveTaskRunner({ task: currentTask, token: taskToken });
          }}
        />
      )}

      {/* Active Task Timer Execution Modal */}
      {activeTaskRunner && (
        <ActiveTaskModal
          task={activeTaskRunner.task}
          taskToken={activeTaskRunner.token}
          isOpen={!!activeTaskRunner}
          onClose={() => setActiveTaskRunner(null)}
          onCompletedSuccess={() => {
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};
