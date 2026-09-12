import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { Advertisement } from '../../types.js';
import { formatBdt } from '../../utils/format.js';
import {
  Tv,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Code,
  Sparkles,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminAdManagement: React.FC = () => {
  const { adminToken, addToast } = useApp();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [placement, setPlacement] = useState<'task_gate' | 'watch_earn' | 'banner'>('task_gate');
  const [provider, setProvider] = useState<'Adsterra' | 'Custom' | 'SocialBar' | 'Native'>('Adsterra');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [rewardBdt, setRewardBdt] = useState('2.50');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ads', {
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setTitle('');
    setPlacement('task_gate');
    setProvider('Adsterra');
    setDurationSeconds(10);
    setRewardBdt('2.50');
    setCodeSnippet(
      `<div class="p-6 text-center text-white bg-slate-950 rounded-2xl border border-slate-800">
  <h4 class="text-sm font-bold text-amber-400">Adsterra Smart Direct Link Ad</h4>
  <p class="text-xs text-slate-400 mt-1">High-CPM monetization partner banner.</p>
</div>`
    );
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setPlacement(ad.placement);
    setProvider(ad.provider);
    setDurationSeconds(ad.durationSeconds);
    setRewardBdt(String(ad.rewardBdt));
    setCodeSnippet(ad.codeSnippet);
    setIsActive(ad.isActive);
    setIsModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title,
        placement,
        provider,
        durationSeconds: Number(durationSeconds) || 10,
        rewardBdt: parseFloat(rewardBdt) || 0,
        codeSnippet,
        isActive,
      };

      const url = editingAd ? `/api/admin/ads/${editingAd.id}` : '/api/admin/ads';
      const method = editingAd ? 'PUT' : 'POST';

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
        addToast('success', editingAd ? 'Ad configuration updated!' : 'New ad configuration added!');
        setIsModalOpen(false);
        fetchAds();
      } else {
        addToast('error', data.error || 'Failed to save ad');
      }
    } catch {
      addToast('error', 'Network error saving ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad configuration?')) return;

    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || '',
        },
      });
      if (res.ok) {
        addToast('success', 'Ad configuration deleted');
        fetchAds();
      }
    } catch {
      addToast('error', 'Network error deleting ad');
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (res.ok) {
        addToast('success', `Ad ${!ad.isActive ? 'activated' : 'deactivated'}`);
        fetchAds();
      }
    } catch {
      addToast('error', 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Advertisement Network & CPM Config</h2>
          <p className="text-xs text-slate-400">
            Configure the 10-second Ad Gate, Video Ads, Adsterra scripts, and display snippets.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ad Placement</span>
        </button>
      </div>

      {/* Ads Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 animate-pulse" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No advertisements configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Ad Campaign</th>
                  <th className="pb-3 font-semibold">Placement Role</th>
                  <th className="pb-3 font-semibold">Network / Provider</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">User Reward</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ads.map((ad) => (
                  <tr key={ad.id} className="text-slate-300 hover:bg-slate-950/40 transition">
                    <td className="py-3.5 pr-3 font-bold text-white max-w-xs truncate">
                      {ad.title}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          ad.placement === 'task_gate'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {ad.placement === 'task_gate' ? '10s Task Ad Gate' : 'Watch & Earn'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-300 font-semibold">{ad.provider}</td>
                    <td className="py-3.5 font-mono">{ad.durationSeconds}s</td>
                    <td className="py-3.5 font-mono font-bold text-emerald-400">
                      {formatBdt(ad.rewardBdt)}
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          ad.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                        }`}
                      >
                        {ad.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewAd(ad)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Real-time HTML Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                          title="Edit Ad"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition"
                          title="Delete Ad"
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

      {/* Form Modal */}
      {isModalOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  {editingAd ? 'Edit Ad Network Configuration' : 'Add Advertisement Slot'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ad Unit Title / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Adsterra Direct Link Smart Gate"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Placement Role
                    </label>
                    <select
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="task_gate">Task 10-Second Ad Gate</option>
                      <option value="watch_earn">Watch Ads & Earn</option>
                      <option value="banner">Banner Placement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ad Network Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="Adsterra">Adsterra</option>
                      <option value="SocialBar">Social Bar</option>
                      <option value="Native">Native CPM</option>
                      <option value="Custom">Custom Advertiser</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Duration / Timer (Seconds)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={60}
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Reward for User (BDT ৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={rewardBdt}
                      onChange={(e) => setRewardBdt(e.target.value)}
                      placeholder="2.50"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      HTML / Adsterra Script / Iframe Snippet
                    </label>
                    <span className="text-[10px] text-slate-500">Live HTML rendering supported</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="<script>... or HTML creative tags"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs font-mono text-emerald-400 outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span>Active in ad rotation</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                  >
                    {submitting ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Preview Modal */}
      {previewAd && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Ad Real-Time Render Preview
                </span>
                <button
                  onClick={() => setPreviewAd(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4 min-h-[140px] flex items-center justify-center overflow-hidden">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: previewAd.codeSnippet }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 mb-4">
                <span>
                  Provider: <strong className="text-white">{previewAd.provider}</strong>
                </span>
                <span>
                  Duration: <strong className="text-white font-mono">{previewAd.durationSeconds}s</strong>
                </span>
                <span>
                  Reward: <strong className="text-emerald-400 font-mono">{formatBdt(previewAd.rewardBdt)}</strong>
                </span>
              </div>

              <button
                onClick={() => setPreviewAd(null)}
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
