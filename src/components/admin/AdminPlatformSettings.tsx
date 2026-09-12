import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { PlatformSettings } from '../../types.js';
import { formatBdt } from '../../utils/format.js';
import {
  Sliders,
  Sparkles,
  Gift,
  Coins,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AdminPlatformSettings: React.FC = () => {
  const { adminToken, addToast, refreshSettings } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/settings', {
          headers: {
            'x-admin-token': adminToken || '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [adminToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', 'Platform settings saved successfully!');
        setSettings(data.settings);
        refreshSettings();
      } else {
        addToast('error', data.error || 'Failed to save settings');
      }
    } catch {
      addToast('error', 'Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-900 border border-slate-800" />
        <div className="h-40 rounded-3xl bg-slate-900 border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Platform Economics & Limits</h2>
          <p className="text-xs text-slate-400">
            Configure withdrawal thresholds, fee percentages, Spin Wheel jackpot probabilities, and referral bonuses.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Withdrawal Limits & Fees */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Withdrawal & Fee Configurations</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minimum Withdrawal (BDT ৳)
              </label>
              <input
                type="number"
                step="any"
                required
                value={settings.withdrawal.minAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    withdrawal: { ...settings.withdrawal, minAmount: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maximum Withdrawal (BDT ৳)
              </label>
              <input
                type="number"
                step="any"
                required
                value={settings.withdrawal.maxAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    withdrawal: { ...settings.withdrawal, maxAmount: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fee Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.withdrawal.feePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    withdrawal: { ...settings.withdrawal, feePercent: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                USDT Rate (1 USDT = BDT ৳)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={settings.withdrawal.usdtExchangeRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    withdrawal: { ...settings.withdrawal, usdtExchangeRate: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Referral Commission Settings */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Gift className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Referral Program Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Commission Model
              </label>
              <select
                value={settings.referral.type}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    referral: { ...settings.referral, type: e.target.value as any },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="fixed">Fixed BDT Amount</option>
                <option value="percentage">Percentage of Task Earnings</option>
              </select>
            </div>

            {settings.referral.type === 'fixed' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fixed Reward (BDT ৳)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.referral.fixedAmount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referral: { ...settings.referral, fixedAmount: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settings.referral.commissionRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referral: { ...settings.referral, commissionRate: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                />
              </div>
            )}

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.referral.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referral: { ...settings.referral, enabled: e.target.checked },
                    })
                  }
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                <span>Enable Referral Program</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Spin Wheel Settings & Slices */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Spin & Win Wheel Settings</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={settings.spin.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    spin: { ...settings.spin, enabled: e.target.checked },
                  })
                }
                className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
              />
              <span>Wheel Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                প্রতি দিন স্পিন লিমিট (Daily Spin Limit)
              </label>
              <input
                type="number"
                min={1}
                max={5000}
                value={settings.spin.dailyLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    spin: { ...settings.spin, dailyLimit: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                প্রতিদিন ব্যবহারকারী সর্বোচ্চ কতবার স্পিন করতে পারবে (ডিফল্ট: ৫০০ বার)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                বিজ্ঞাপন বিরতি সময় (Ad Duration - Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={settings.spin.adDurationSeconds ?? 15}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    spin: { ...settings.spin, adDurationSeconds: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                প্রতি স্পিনের পর কত সেকেন্ড বিজ্ঞাপন দেখানো হবে (ডিফল্ট: ১৫ সেকেন্ড)
              </p>
            </div>
          </div>

          {/* 1 Spin পর পর ১৫ সেকেন্ড Ad অপশন টগল */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>১ Spin পর পর ১৫ সেকেন্ড Ad বসানোর অপশন (Ad between Spins)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                চালু থাকলে প্রতিটি স্পিন শেষ হওয়ার পর বাধ্যতামূলক ১৫ সেকেন্ড স্পন্সর বিজ্ঞাপন দেখানো হবে।
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.spin.requireAdBetweenSpins ?? true}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    spin: { ...settings.spin, requireAdBetweenSpins: e.target.checked },
                  })
                }
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0 w-4 h-4"
              />
              <span className="ml-2 text-xs font-semibold text-slate-300">
                {(settings.spin.requireAdBetweenSpins ?? true) ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
              </span>
            </label>
          </div>

          {/* Slices Config */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Wheel Segment Values & Probabilities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {settings.spin.slices.map((slice, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: slice.color }}
                      />
                      Segment #{index + 1}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      ৳{slice.rewardBdt}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">Label</span>
                      <input
                        type="text"
                        value={slice.label}
                        onChange={(e) => {
                          const updated = [...settings.spin.slices];
                          updated[index] = { ...updated[index], label: e.target.value };
                          setSettings({
                            ...settings,
                            spin: { ...settings.spin, slices: updated },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Reward (৳)</span>
                      <input
                        type="number"
                        step="any"
                        value={slice.rewardBdt}
                        onChange={(e) => {
                          const updated = [...settings.spin.slices];
                          updated[index] = {
                            ...updated[index],
                            rewardBdt: Number(e.target.value),
                          };
                          setSettings({
                            ...settings,
                            spin: { ...settings.spin, slices: updated },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Announcements Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Platform Announcement Broadcast</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Top Header Announcement Text
            </label>
            <input
              type="text"
              value={settings.announcements?.[0] || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcements: [e.target.value],
                })
              }
              placeholder="e.g. Welcome to TakaEarnBD! Watch sponsor ads and earn BDT every 10 seconds."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
