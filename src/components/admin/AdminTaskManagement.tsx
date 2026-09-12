import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { Task, TaskCategory } from '../../types.js';
import { formatBdt } from '../../utils/format.js';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Sparkles,
  Shield,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminTaskManagement: React.FC = () => {
  const { adminToken, addToast } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('social');
  const [rewardBdt, setRewardBdt] = useState('15.00');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [actionUrl, setActionUrl] = useState('');
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewTask, setPreviewTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('social');
    setRewardBdt('15.00');
    setDurationSeconds(30);
    setActionUrl('');
    setIsRepeatable(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setRewardBdt(String(task.rewardBdt));
    setDurationSeconds(task.durationSeconds);
    setActionUrl(task.actionUrl || '');
    setIsRepeatable(task.isRepeatable);
    setIsActive(task.isActive);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        rewardBdt: parseFloat(rewardBdt) || 10,
        durationSeconds: Number(durationSeconds) || 30,
        actionUrl,
        isRepeatable,
        isActive,
      };

      const url = editingTask
        ? `/api/admin/tasks/${editingTask.id}`
        : '/api/admin/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', editingTask ? 'Task updated successfully!' : 'Task created successfully!');
        setIsModalOpen(false);
        fetchTasks();
      } else {
        addToast('error', data.error || 'Failed to save task');
      }
    } catch {
      addToast('error', 'Network error saving task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        addToast('success', 'Task removed successfully');
        fetchTasks();
      } else {
        addToast('error', 'Could not delete task');
      }
    } catch {
      addToast('error', 'Network error deleting task');
    }
  };

  const handleToggleActive = async (task: Task) => {
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      if (res.ok) {
        addToast('success', `Task ${!task.isActive ? 'enabled' : 'disabled'}`);
        fetchTasks();
      }
    } catch {
      addToast('error', 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Task Campaign Management</h2>
          <p className="text-xs text-slate-400">
            Create tasks, configure rewards, customize 10-second Ad Gates, and inspect completions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No tasks registered yet. Click "Add New Task" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Task Details</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reward</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Repeatable</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="text-slate-300 hover:bg-slate-950/40 transition">
                    <td className="py-3.5 pr-4 max-w-xs">
                      <div className="font-bold text-white text-sm truncate">{task.title}</div>
                      <div className="text-slate-400 line-clamp-1 text-[11px]">{task.description}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {task.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-emerald-400">
                      {formatBdt(task.rewardBdt)}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {task.durationSeconds}s
                    </td>
                    <td className="py-3.5">
                      {task.isRepeatable ? (
                        <span className="text-emerald-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-500">Once</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => handleToggleActive(task)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          task.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                        }`}
                      >
                        {task.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Preview Task"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">
                  {editingTask ? 'Edit Task Campaign' : 'Create New Task Campaign'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Subscribe to YouTube Channel & Like Video"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description & Instructions
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain step-by-step instructions for the user..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="social">Social Media</option>
                      <option value="app_install">App Install</option>
                      <option value="survey">Survey</option>
                      <option value="read">Read Article</option>
                      <option value="daily">Daily Bonus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Reward Amount (BDT ৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={rewardBdt}
                      onChange={(e) => setRewardBdt(e.target.value)}
                      placeholder="15.00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Task Timer / Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={300}
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                    />
                    <span className="text-[10px] text-slate-500">
                      Does not include the mandatory 10s Ad Gate
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Action URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isRepeatable}
                      onChange={(e) => setIsRepeatable(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span>Allow Repeatable Completion</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span>Active & Published</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50"
                  >
                    {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Publish Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Preview Modal */}
      {previewTask && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Task Preview
                </span>
                <button
                  onClick={() => setPreviewTask(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
                    +{formatBdt(previewTask.rewardBdt)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {previewTask.durationSeconds}s duration
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-2">{previewTask.title}</h4>
                <p className="text-xs text-slate-400">{previewTask.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-4">
                <strong>10s Ad Gate Enforced:</strong> Users must view the configured sponsor advertisement for 10 seconds before this task starts.
              </div>

              <button
                onClick={() => setPreviewTask(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
