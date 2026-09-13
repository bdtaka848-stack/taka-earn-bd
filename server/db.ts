import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Admin,
  Task,
  TaskCompletion,
  Transaction,
  Withdrawal,
  Referral,
  ReferralSettings,
  SpinSettings,
  SpinResult,
  Advertisement,
  SystemSettings,
  AuditLog,
} from '../src/types.js';

interface DatabaseSchema {
  users: User[];
  admins: Admin[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  referrals: Referral[];
  referralSettings: ReferralSettings;
  spinSettings: SpinSettings;
  spinResults: SpinResult[];
  advertisements: Advertisement[];
  systemSettings: SystemSettings;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'taskbdt_db.json');

// In-memory active security sessions for timers (server-verified)
interface ActiveAdGate {
  sessionId: string;
  userId: string;
  taskId: string;
  adId: string;
  startedAt: number; // Date.now()
  durationMs: number; // 10000ms
  verified: boolean;
}

interface ActiveTaskSession {
  token: string;
  userId: string;
  taskId: string;
  startedAt: number;
  durationMs: number;
}

interface ActiveAdWatchSession {
  sessionId: string;
  userId: string;
  adId: string;
  startedAt: number;
  durationMs: number;
}

const activeAdGates = new Map<string, ActiveAdGate>();
const activeTaskSessions = new Map<string, ActiveTaskSession>();
const activeAdWatchSessions = new Map<string, ActiveAdWatchSession>();

function getInitialData(): DatabaseSchema {
  const initialUsers: User[] = [
    {
      id: 'usr_demo_1',
      username: 'sabbir_khan',
      name: 'Sabbir Hossain',
      email: 'sabbir@example.com',
      phone: '01712345678',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      balance: 850.50,
      totalEarned: 2015.00,
      referralEarnings: 240.00,
      taskEarnings: 820.00,
      adEarnings: 340.50,
      spinEarnings: 249.50,
      referralCode: 'BDT888',
      referredBy: undefined,
      referralsCount: 6,
      activeReferralsCount: 4,
      status: 'active',
      createdAt: '2026-08-01T10:00:00.000Z',
      lastActive: new Date().toISOString(),
    },
    {
      id: 'usr_tanvir_2',
      username: 'tanvir_ahmed',
      name: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      phone: '01898765432',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      balance: 120.00,
      totalEarned: 350.00,
      referralEarnings: 0,
      taskEarnings: 210.00,
      adEarnings: 85.00,
      spinEarnings: 55.00,
      referralCode: 'TANVIR26',
      referredBy: 'BDT888',
      referralsCount: 1,
      activeReferralsCount: 1,
      status: 'active',
      createdAt: '2026-08-15T12:30:00.000Z',
      lastActive: new Date().toISOString(),
    },
    {
      id: 'usr_nusrat_3',
      username: 'nusrat_jahan',
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      phone: '01911223344',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      balance: 75.00,
      totalEarned: 190.00,
      referralEarnings: 25.00,
      taskEarnings: 110.00,
      adEarnings: 30.00,
      spinEarnings: 25.00,
      referralCode: 'NUSRAT9',
      referredBy: 'BDT888',
      referralsCount: 0,
      activeReferralsCount: 0,
      status: 'active',
      createdAt: '2026-08-20T15:45:00.000Z',
      lastActive: new Date().toISOString(),
    }
  ];

  const initialAdmins: Admin[] = [
    {
      id: 'adm_1',
      username: 'demo',
      name: 'TakaEarnBD Administrator',
      role: 'super_admin',
    },
  ];

  const initialAds: Advertisement[] = [
    {
      id: 'ad_gate_default',
      title: 'Adsterra High CPM Sponsor Ad',
      provider: 'Adsterra',
      codeSnippet: `<div class="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/30 text-white text-center shadow-xl">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
    <span>★ Sponsored Premium Offer</span>
  </div>
  <h4 class="text-xl font-bold tracking-tight text-white mb-2">Upgrade to Ultra Fast High-Yield Cloud Server</h4>
  <p class="text-sm text-slate-300 max-w-md mx-auto mb-4 leading-relaxed">
    Get 80% exclusive discount on fast cloud hosting with global DDoS protection & 99.99% uptime guarantee.
  </p>
  <div class="flex items-center justify-center gap-3">
    <span class="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-lg transition">Explore Deal →</span>
  </div>
</div>`,
      placement: 'before_task',
      durationSeconds: 10,
      rewardBdt: 0,
      dailyLimit: 100,
      enabled: true,
      viewsCount: 1420,
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
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
      rewardBdt: 5.00,
      dailyLimit: 500,
      enabled: true,
      viewsCount: 4890,
      createdAt: '2026-08-05T00:00:00.000Z',
    },
    {
      id: 'ad_popunder_direct',
      title: 'Monetag / Popunder Traffic Network',
      provider: 'Popunder',
      codeSnippet: `<!-- Popunder Integration Script Placeholder: configured in Popunder Zone ID -->`,
      placement: 'popunder',
      durationSeconds: 5,
      rewardBdt: 1.50,
      dailyLimit: 20,
      enabled: true,
      viewsCount: 4200,
      createdAt: '2026-08-12T00:00:00.000Z',
    },
    {
      id: 'ad_dashboard_banner',
      title: 'Top Banner - Bangladeshi Tech Offers',
      provider: 'Adsterra',
      codeSnippet: `<div class="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 p-4 rounded-xl border border-emerald-500/30 text-white flex items-center justify-between">
  <div>
    <span class="text-[10px] font-bold tracking-wider uppercase text-emerald-400">Featured Sponsor</span>
    <h5 class="text-sm font-semibold">Special bKash & Nagad CashBack deals</h5>
  </div>
  <span class="text-xs bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg">Check Offers</span>
</div>`,
      placement: 'dashboard',
      durationSeconds: 0,
      rewardBdt: 0,
      dailyLimit: 9999,
      enabled: true,
      viewsCount: 8120,
      createdAt: '2026-08-15T00:00:00.000Z',
    }
  ];

  const initialTasks: Task[] = [
    {
      id: 'task_youtube_sub',
      title: 'Subscribe to TechNews BD Official Channel',
      description: 'Watch video for 30 seconds, like the video and subscribe to the channel for genuine tech updates in Bangla.',
      rewardBdt: 15.00,
      durationSeconds: 30,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'social',
      status: 'active',
      isRepeatable: false,
      dailyLimit: 1,
      icon: 'Youtube',
      completedCount: 142,
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'task_install_app',
      title: 'Install & Review Daraz Bangladesh App',
      description: 'Download the updated 2026 version of the mobile app, browse categories for 60 seconds and submit review.',
      rewardBdt: 35.00,
      durationSeconds: 60,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'app_install',
      status: 'active',
      isRepeatable: false,
      dailyLimit: 1,
      icon: 'Smartphone',
      completedCount: 88,
      createdAt: '2026-08-12T11:00:00.000Z',
    },
    {
      id: 'task_read_article',
      title: 'Read & Verify "Smart Digital Economy 2026"',
      description: 'Read the comprehensive report on digital micro-payments in Bangladesh for 25 seconds until completion.',
      rewardBdt: 10.00,
      durationSeconds: 25,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'read',
      status: 'active',
      isRepeatable: true,
      dailyLimit: 3,
      icon: 'BookOpen',
      completedCount: 310,
      createdAt: '2026-08-15T09:00:00.000Z',
    },
    {
      id: 'task_fintech_survey',
      title: 'Complete Mobile Banking Survey (bKash/Nagad)',
      description: 'Answer 5 quick multiple choice questions about your experience using mobile financial services in Dhaka.',
      rewardBdt: 45.00,
      durationSeconds: 50,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'survey',
      status: 'active',
      isRepeatable: false,
      dailyLimit: 1,
      icon: 'CheckSquare',
      completedCount: 65,
      createdAt: '2026-08-18T14:00:00.000Z',
    },
    {
      id: 'task_daily_checkin',
      title: 'Daily Quick Platform Verification',
      description: 'Daily check-in task. Watch mandatory 10s ad gate, stay on page for 15s to claim daily attendance bonus.',
      rewardBdt: 5.00,
      durationSeconds: 15,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'daily',
      status: 'active',
      isRepeatable: true,
      dailyLimit: 1,
      icon: 'Calendar',
      completedCount: 820,
      createdAt: '2026-08-20T08:00:00.000Z',
    },
    {
      id: 'task_telegram_join',
      title: 'Join TakaEarnBD Community Telegram Group',
      description: 'Join our official community group for exclusive high-paying tasks, promo codes, and withdrawal proofs.',
      rewardBdt: 20.00,
      durationSeconds: 20,
      adRequired: true,
      adDurationSeconds: 10,
      adId: 'ad_gate_default',
      category: 'social',
      status: 'active',
      isRepeatable: false,
      dailyLimit: 1,
      icon: 'Send',
      completedCount: 412,
      createdAt: '2026-08-22T10:00:00.000Z',
    },
  ];

  const initialTaskCompletions: TaskCompletion[] = [
    {
      id: 'cmp_1',
      userId: 'usr_demo_1',
      taskId: 'task_youtube_sub',
      taskTitle: 'Subscribe to TechNews BD Official Channel',
      rewardBdt: 15.00,
      startedAt: '2026-09-08T09:12:00.000Z',
      completedAt: '2026-09-08T09:12:40.000Z',
      status: 'completed',
    },
    {
      id: 'cmp_2',
      userId: 'usr_demo_1',
      taskId: 'task_daily_checkin',
      taskTitle: 'Daily Quick Platform Verification',
      rewardBdt: 5.00,
      startedAt: '2026-09-09T00:30:00.000Z',
      completedAt: '2026-09-09T00:30:25.000Z',
      status: 'completed',
    },
  ];

  const initialTransactions: Transaction[] = [
    {
      id: 'tx_init_1',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'task',
      amount: 15.00,
      status: 'completed',
      description: 'Reward for task: Subscribe to TechNews BD Official Channel',
      createdAt: '2026-09-08T09:12:40.000Z',
    },
    {
      id: 'tx_init_2',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'ad',
      amount: 4.50,
      status: 'completed',
      description: 'Reward for watching Social Bar video ad #1',
      createdAt: '2026-09-08T11:20:00.000Z',
    },
    {
      id: 'tx_init_3',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'spin',
      amount: 25.00,
      status: 'completed',
      description: 'Daily Lucky Spin wheel win reward',
      createdAt: '2026-09-08T14:45:00.000Z',
    },
    {
      id: 'tx_init_4',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'referral',
      amount: 25.00,
      status: 'completed',
      description: 'Referral commission bonus for new user tanvir_ahmed',
      createdAt: '2026-08-15T12:35:00.000Z',
    },
    {
      id: 'tx_init_5',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'withdrawal',
      amount: -500.00,
      status: 'completed',
      description: 'Withdrawal to bKash 01712345678 (Fee: ৳12.50)',
      createdAt: '2026-08-28T16:00:00.000Z',
    },
    {
      id: 'tx_init_6',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      type: 'task',
      amount: 5.00,
      status: 'completed',
      description: 'Reward for task: Daily Quick Platform Verification',
      createdAt: '2026-09-09T00:30:25.000Z',
    }
  ];

  const initialWithdrawals: Withdrawal[] = [
    {
      id: 'wth_demo_completed',
      userId: 'usr_demo_1',
      username: 'sabbir_khan',
      userEmail: 'sabbir@example.com',
      method: 'bKash',
      details: { accountNumber: '01712345678' },
      amount: 500.00,
      fee: 12.50,
      netAmount: 487.50,
      status: 'completed',
      adminNote: 'TrxID: 9J7K3L21AB disbursed via bKash Merchant API',
      createdAt: '2026-08-28T16:00:00.000Z',
      updatedAt: '2026-08-28T16:45:00.000Z',
    },
    {
      id: 'wth_demo_pending',
      userId: 'usr_tanvir_2',
      username: 'tanvir_ahmed',
      userEmail: 'tanvir@example.com',
      method: 'Nagad',
      details: { accountNumber: '01898765432' },
      amount: 200.00,
      fee: 5.00,
      netAmount: 195.00,
      status: 'pending',
      adminNote: '',
      createdAt: '2026-09-08T21:15:00.000Z',
      updatedAt: '2026-09-08T21:15:00.000Z',
    },
    {
      id: 'wth_demo_processing',
      userId: 'usr_nusrat_3',
      username: 'nusrat_jahan',
      userEmail: 'nusrat@example.com',
      method: 'USDT',
      details: {
        network: 'TRC20',
        walletAddress: 'TYDzsYUEpvnYmQK4zGP9s21K9QhLwHxyz7',
      },
      amount: 366.00, // ~ 3 USDT
      fee: 9.15,
      netAmount: 356.85,
      status: 'processing',
      adminNote: 'Awaiting TRC20 network broadcast confirmation',
      createdAt: '2026-09-09T00:10:00.000Z',
      updatedAt: '2026-09-09T00:40:00.000Z',
    }
  ];

  const initialReferrals: Referral[] = [
    {
      id: 'ref_1',
      referrerId: 'usr_demo_1',
      refereeId: 'usr_tanvir_2',
      refereeUsername: 'tanvir_ahmed',
      status: 'active',
      rewardBdt: 25.00,
      createdAt: '2026-08-15T12:30:00.000Z',
    },
    {
      id: 'ref_2',
      referrerId: 'usr_demo_1',
      refereeId: 'usr_nusrat_3',
      refereeUsername: 'nusrat_jahan',
      status: 'active',
      rewardBdt: 25.00,
      createdAt: '2026-08-20T15:45:00.000Z',
    },
    {
      id: 'ref_3',
      referrerId: 'usr_demo_1',
      refereeId: 'usr_shuvo_4',
      refereeUsername: 'shuvo_roy',
      status: 'active',
      rewardBdt: 25.00,
      createdAt: '2026-08-25T11:20:00.000Z',
    }
  ];

  const initialReferralSettings: ReferralSettings = {
    enabled: true,
    type: 'fixed', // 'fixed' or 'percentage'
    commissionRate: 10, // 10%
    fixedAmount: 25.00, // ৳25 per active registered referral
    minWithdrawalForCommission: 2000,
  };

  const initialSpinSettings: SpinSettings = {
    enabled: true,
    dailyLimit: 500,
    requireAdBetweenSpins: true,
    adDurationSeconds: 15,
    slices: [
      { label: '৳ 5', rewardBdt: 5, probability: 35, color: '#3b82f6', textColor: '#ffffff' },
      { label: '৳ 10', rewardBdt: 10, probability: 25, color: '#10b981', textColor: '#ffffff' },
      { label: '৳ 2', rewardBdt: 2, probability: 20, color: '#f59e0b', textColor: '#ffffff' },
      { label: '৳ 25', rewardBdt: 25, probability: 10, color: '#8b5cf6', textColor: '#ffffff' },
      { label: '৳ 50', rewardBdt: 50, probability: 7, color: '#ec4899', textColor: '#ffffff' },
      { label: '৳ 100 🏆', rewardBdt: 100, probability: 3, color: '#ef4444', textColor: '#ffffff' },
    ],
  };

  const initialSpinResults: SpinResult[] = [
    {
      id: 'spn_1',
      userId: 'usr_demo_1',
      rewardBdt: 25.00,
      sliceIndex: 3,
      spunAt: '2026-09-08T14:45:00.000Z',
    }
  ];

  const initialSystemSettings: SystemSettings = {
    siteName: 'TakaEarnBD Rewards',
    currencySymbol: '৳',
    currencyCode: 'BDT',
    minWithdrawal: 2000.00,
    maxWithdrawal: 20000.00,
    withdrawalFeePercent: 2.5,
    bKashEnabled: true,
    nagadEnabled: true,
    usdtEnabled: true,
    usdtExchangeRate: 122.00, // 1 USDT = 122 BDT
    bKashApiUrl: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    bKashMerchantNumber: '01700000000',
    nagadMerchantId: 'MERCHANT_BD_1001',
    usdtTrc20Address: 'TNv9k1xL7Qp2mY4xZs8gH1vN8kL3w',
    adsterraPublisherId: 'adst_pub_8492048',
    socialBarZoneId: 'sb_zone_9921',
    popunderZoneId: 'pop_zone_4412',
  };

  const initialAuditLogs: AuditLog[] = [
    {
      id: 'log_1',
      adminUsername: 'demo',
      action: 'PLATFORM_INITIALIZATION',
      targetType: 'settings',
      targetId: 'sys_init',
      details: 'TakaEarnBD Core engine launched with BDT currency standard and 10s verified ad gate.',
      ip: '127.0.0.1',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'log_2',
      adminUsername: 'demo',
      action: 'UPDATE_WITHDRAWAL_STATUS',
      targetType: 'withdrawal',
      targetId: 'wth_demo_completed',
      details: 'Approved and marked completed bKash withdrawal of ৳500.00 for user sabbir_khan',
      ip: '127.0.0.1',
      createdAt: '2026-08-28T16:45:00.000Z',
    }
  ];

  return {
    users: initialUsers,
    admins: initialAdmins,
    tasks: initialTasks,
    taskCompletions: initialTaskCompletions,
    transactions: initialTransactions,
    withdrawals: initialWithdrawals,
    referrals: initialReferrals,
    referralSettings: initialReferralSettings,
    spinSettings: initialSpinSettings,
    spinResults: initialSpinResults,
    advertisements: initialAds,
    systemSettings: initialSystemSettings,
    auditLogs: initialAuditLogs,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir:', err);
      }
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all keys exist
        const initial = getInitialData();
        return {
          users: (parsed.users || initial.users).map((u: User) => ({
            ...u,
            password: u.password || '123456',
          })),
          admins: parsed.admins || initial.admins,
          tasks: parsed.tasks || initial.tasks,
          taskCompletions: parsed.taskCompletions || initial.taskCompletions,
          transactions: parsed.transactions || initial.transactions,
          withdrawals: parsed.withdrawals || initial.withdrawals,
          referrals: parsed.referrals || initial.referrals,
          referralSettings: {
            ...initial.referralSettings,
            ...(parsed.referralSettings || {}),
            enabled: true,
            type: 'fixed',
            fixedAmount: 25.00,
          },
          spinSettings: {
            ...initial.spinSettings,
            ...(parsed.spinSettings || {}),
            dailyLimit: (parsed.spinSettings?.dailyLimit && parsed.spinSettings.dailyLimit >= 500)
              ? parsed.spinSettings.dailyLimit
              : 500,
            requireAdBetweenSpins: parsed.spinSettings?.requireAdBetweenSpins !== undefined
              ? parsed.spinSettings.requireAdBetweenSpins
              : true,
            adDurationSeconds: parsed.spinSettings?.adDurationSeconds || 15,
          },
          spinResults: parsed.spinResults || initial.spinResults,
          advertisements: (() => {
            const rawAds: Advertisement[] = parsed.advertisements || initial.advertisements;
            // Retain non-watch_ads and exactly 1 Video CPM task for watch_ads
            const nonWatchAds = rawAds.filter((a) => a.placement !== 'watch_ads');
            const videoCpmAd = initial.advertisements.find((a) => a.placement === 'watch_ads') || {
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
              placement: 'watch_ads' as const,
              durationSeconds: 15,
              rewardBdt: 5.00,
              dailyLimit: 500,
              enabled: true,
              viewsCount: 4890,
              createdAt: '2026-08-05T00:00:00.000Z',
            };
            return [...nonWatchAds, videoCpmAd];
          })(),
          systemSettings: {
            ...initial.systemSettings,
            ...(parsed.systemSettings || {}),
            minWithdrawal:
              parsed.systemSettings?.minWithdrawal === 100 ||
              parsed.systemSettings?.minWithdrawal === 500
                ? 2000
                : parsed.systemSettings?.minWithdrawal || 2000,
            maxWithdrawal:
              parsed.systemSettings?.maxWithdrawal === 15000 ||
              parsed.systemSettings?.maxWithdrawal === 50000 ||
              !parsed.systemSettings?.maxWithdrawal
                ? 20000
                : parsed.systemSettings.maxWithdrawal,
          },
          auditLogs: parsed.auditLogs || initial.auditLogs,
        };
      }
    } catch (e) {
      console.warn('Could not read existing database, generating fresh seed:', e);
    }
    const fresh = getInitialData();
    this.saveData(fresh);
    return fresh;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      this.ensureDataDir();
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(userData: Partial<User> & { username: string; password?: string; name: string; email: string; phone: string }): User {
    const code = 'BDT' + Math.floor(100000 + Math.random() * 900000);
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      username: userData.username.trim(),
      password: userData.password?.trim() || '123456',
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      balance: 0,
      totalEarned: 0,
      referralEarnings: 0,
      taskEarnings: 0,
      adEarnings: 0,
      spinEarnings: 0,
      referralCode: code,
      referredBy: userData.referredBy,
      referralsCount: 0,
      activeReferralsCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // If referred by another user, record referral and apply commission if applicable
    if (userData.referredBy) {
      const referrer = this.data.users.find(
        (u) => u.referralCode.toUpperCase() === userData.referredBy?.toUpperCase()
      );
      if (referrer) {
        referrer.referralsCount = (referrer.referralsCount || 0) + 1;
        referrer.activeReferralsCount = (referrer.activeReferralsCount || 0) + 1;
        const refBonus = Number(this.data.referralSettings?.fixedAmount || 25.00);

        if (refBonus > 0) {
          referrer.balance = Number((referrer.balance + refBonus).toFixed(2));
          referrer.totalEarned = Number((referrer.totalEarned + refBonus).toFixed(2));
          referrer.referralEarnings = Number((referrer.referralEarnings + refBonus).toFixed(2));

          this.data.referrals.unshift({
            id: `ref_${Date.now()}`,
            referrerId: referrer.id,
            refereeId: newUser.id,
            refereeUsername: newUser.username,
            status: 'active',
            rewardBdt: refBonus,
            createdAt: new Date().toISOString(),
          });

          this.data.transactions.unshift({
            id: `tx_ref_${Date.now()}`,
            userId: referrer.id,
            username: referrer.username,
            type: 'referral',
            amount: refBonus,
            status: 'completed',
            description: `৳${refBonus.toFixed(2)} Referral sign-up bonus earned for inviting @${newUser.username}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    this.data.users.unshift(newUser);
    this.saveData();
    return newUser;
  }

  public applyReferral(userId: string, referralCode: string): { success: boolean; message: string; reward?: number } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User not found)' };
    if (user.referredBy) return { success: false, message: 'আপনি ইতোমধ্যে একটি রেফারেল কোড ব্যবহার করেছেন (Already referred)' };

    const cleanCode = referralCode.trim().toUpperCase();
    if (user.referralCode.toUpperCase() === cleanCode) {
      return { success: false, message: 'নিজের রেফারেল কোড নিজে ব্যবহার করা যাবে না (Cannot use own code)' };
    }

    const referrer = this.data.users.find((u) => u.referralCode.toUpperCase() === cleanCode);
    if (!referrer) {
      return { success: false, message: 'সঠিক রেফার কোড দিন। এই কোডের কোনো অ্যাকাউন্ট নেই (Invalid referral code)' };
    }

    const refBonus = Number(this.data.referralSettings?.fixedAmount || 25.00);

    referrer.referralsCount = (referrer.referralsCount || 0) + 1;
    referrer.activeReferralsCount = (referrer.activeReferralsCount || 0) + 1;
    referrer.balance = Number((referrer.balance + refBonus).toFixed(2));
    referrer.totalEarned = Number((referrer.totalEarned + refBonus).toFixed(2));
    referrer.referralEarnings = Number((referrer.referralEarnings + refBonus).toFixed(2));

    this.data.referrals.unshift({
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referrerId: referrer.id,
      refereeId: user.id,
      refereeUsername: user.username,
      status: 'active',
      rewardBdt: refBonus,
      createdAt: new Date().toISOString(),
    });

    this.data.transactions.unshift({
      id: `tx_ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: referrer.id,
      username: referrer.username,
      type: 'referral',
      amount: refBonus,
      status: 'completed',
      description: `৳${refBonus.toFixed(2)} রেফার বোনাস জমা হয়েছে (আমন্ত্রিত ব্যবহারকারী: @${user.username})`,
      createdAt: new Date().toISOString(),
    });

    user.referredBy = referrer.referralCode;
    this.saveData();

    return {
      success: true,
      message: `রেফার কোড সফলভাবে যোগ হয়েছে! রেফারার @${referrer.username} ৳${refBonus.toFixed(2)} বোনাস পেয়েছেন।`,
      reward: refBonus,
    };
  }

  public simulateReferralInvite(
    referrerId: string,
    friendName?: string
  ): { success: boolean; message: string; reward: number; refereeUsername: string } {
    const referrer = this.getUserById(referrerId);
    if (!referrer) {
      return { success: false, message: 'Referrer user not found', reward: 0, refereeUsername: '' };
    }

    const refBonus = Number(this.data.referralSettings?.fixedAmount || 25.00);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanName = friendName ? friendName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'friend';
    const mockUsername = `${cleanName || 'friend'}_${randomSuffix}`;

    referrer.referralsCount = (referrer.referralsCount || 0) + 1;
    referrer.activeReferralsCount = (referrer.activeReferralsCount || 0) + 1;
    referrer.balance = Number((referrer.balance + refBonus).toFixed(2));
    referrer.totalEarned = Number((referrer.totalEarned + refBonus).toFixed(2));
    referrer.referralEarnings = Number((referrer.referralEarnings + refBonus).toFixed(2));

    const newRef: Referral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referrerId: referrer.id,
      refereeId: `usr_mock_${Date.now()}`,
      refereeUsername: mockUsername,
      status: 'active',
      rewardBdt: refBonus,
      createdAt: new Date().toISOString(),
    };
    this.data.referrals.unshift(newRef);

    this.data.transactions.unshift({
      id: `tx_ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: referrer.id,
      username: referrer.username,
      type: 'referral',
      amount: refBonus,
      status: 'completed',
      description: `৳${refBonus.toFixed(2)} রেফার বোনাস জমা হয়েছে (আমন্ত্রিত ব্যবহারকারী: @${mockUsername})`,
      createdAt: new Date().toISOString(),
    });

    this.saveData();

    return {
      success: true,
      message: `সফলভাবে ১টি রেফার সম্পন্ন হয়েছে! আপনার একাউন্টে ৳${refBonus.toFixed(2)} বোনাস সাথে সাথে যোগ হয়েছে।`,
      reward: refBonus,
      refereeUsername: mockUsername,
    };
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { lastActive: new Date().toISOString() });
    this.saveData();
    return user;
  }

  public adjustUserBalance(
    userId: string,
    deltaAmount: number,
    adminUsername: string,
    reason: string
  ): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const newBalance = Number((user.balance + deltaAmount).toFixed(2));
    if (newBalance < 0) {
      return { success: false, error: 'User balance cannot be negative' };
    }

    user.balance = newBalance;
    if (deltaAmount > 0) {
      user.totalEarned = Number((user.totalEarned + deltaAmount).toFixed(2));
    }

    // Record transaction
    this.data.transactions.unshift({
      id: `tx_adj_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'admin_adjustment',
      amount: deltaAmount,
      status: 'completed',
      description: `Admin balance adjustment by @${adminUsername}: ${reason}`,
      createdAt: new Date().toISOString(),
    });

    // Record Audit Log
    this.logAdminAction(
      adminUsername,
      'BALANCE_ADJUSTMENT',
      'user',
      user.id,
      `Adjusted balance of @${user.username} by ৳${deltaAmount > 0 ? '+' : ''}${deltaAmount}. New balance: ৳${user.balance}. Reason: ${reason}`
    );

    this.saveData();
    return { success: true, user };
  }

  // --- Admin ---
  public getAdmin(): Admin | undefined {
    return this.data.admins[0];
  }

  public logAdminAction(
    adminUsername: string,
    action: string,
    targetType: AuditLog['targetType'],
    targetId: string,
    details: string,
    ip: string = '127.0.0.1'
  ): AuditLog {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      adminUsername,
      action,
      targetType,
      targetId,
      details,
      ip,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.saveData();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Tasks ---
  public getTasks(userId?: string): Array<Task & { userCompleted?: boolean }> {
    return this.data.tasks.map((task) => {
      let userCompleted = false;
      if (userId) {
        userCompleted = this.data.taskCompletions.some(
          (c) => c.userId === userId && c.taskId === task.id && c.status === 'completed'
        );
      }
      return {
        ...task,
        userCompleted,
      };
    });
  }

  public getTaskById(id: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  public createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      completedCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.tasks.unshift(newTask);
    this.saveData();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.getTaskById(id);
    if (!task) return undefined;
    Object.assign(task, updates);
    this.saveData();
    return task;
  }

  public deleteTask(id: string): boolean {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.tasks.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Server-Side Ad Gate & Timer Validation ---
  public startAdGate(userId: string, taskId: string): { sessionId: string; ad: Advertisement; durationSeconds: number } | { error: string } {
    const task = this.getTaskById(taskId);
    if (!task) return { error: 'Task not found' };
    if (task.status !== 'active') return { error: 'Task is currently disabled' };

    // Check if user already completed this task and it's not repeatable
    if (!task.isRepeatable) {
      const alreadyDone = this.data.taskCompletions.some(
        (c) => c.userId === userId && c.taskId === taskId && c.status === 'completed'
      );
      if (alreadyDone) {
        return { error: 'You have already completed this task' };
      }
    }

    // Get the configured ad or fallback
    let ad = this.data.advertisements.find((a) => a.id === task.adId && a.enabled);
    if (!ad) {
      ad = this.data.advertisements.find((a) => a.placement === 'before_task' && a.enabled) || this.data.advertisements[0];
    }

    const sessionId = `gate_${crypto.randomUUID()}`;
    const durationSeconds = task.adDurationSeconds || 10;

    activeAdGates.set(sessionId, {
      sessionId,
      userId,
      taskId,
      adId: ad.id,
      startedAt: Date.now(),
      durationMs: durationSeconds * 1000,
      verified: false,
    });

    // Increment ad view count
    if (ad) {
      ad.viewsCount = (ad.viewsCount || 0) + 1;
      this.saveData();
    }

    return {
      sessionId,
      ad,
      durationSeconds,
    };
  }

  public cancelAdGate(sessionId: string): { success: boolean } {
    if (activeAdGates.has(sessionId)) {
      activeAdGates.delete(sessionId);
    }
    return { success: true };
  }

  public verifyAdGate(sessionId: string, userId: string): { success: boolean; taskToken?: string; error?: string } {
    const session = activeAdGates.get(sessionId);
    if (!session) {
      return { success: false, error: 'Invalid or expired ad session. Please start the task again.' };
    }

    if (session.userId !== userId) {
      return { success: false, error: 'Unauthorized ad session.' };
    }

    const elapsedMs = Date.now() - session.startedAt;
    const requiredMs = session.durationMs; // 10,000ms

    // Strict server-side verification: give at most 300ms network jitter grace
    if (elapsedMs < (requiredMs - 300)) {
      activeAdGates.delete(sessionId);
      return {
        success: false,
        error: `Ad gate incomplete! You watched for only ${(elapsedMs / 1000).toFixed(1)}s of the required ${(requiredMs / 1000)}s. Task access denied.`
      };
    }

    const task = this.getTaskById(session.taskId);
    if (!task) {
      activeAdGates.delete(sessionId);
      return { success: false, error: 'Task was removed' };
    }

    // Clean up ad gate session
    activeAdGates.delete(sessionId);

    // Issue a server-side Task Session Token
    const taskToken = `task_session_${crypto.randomUUID()}`;
    activeTaskSessions.set(taskToken, {
      token: taskToken,
      userId,
      taskId: task.id,
      startedAt: Date.now(),
      durationMs: task.durationSeconds * 1000,
    });

    return {
      success: true,
      taskToken,
    };
  }

  public completeTask(
    taskToken: string,
    userId: string,
    taskId: string
  ): { success: boolean; rewardBdt?: number; user?: User; error?: string } {
    const session = activeTaskSessions.get(taskToken);
    if (!session) {
      return { success: false, error: 'Invalid or expired task session. You must complete the 10s ad gate first.' };
    }

    if (session.userId !== userId || session.taskId !== taskId) {
      return { success: false, error: 'Invalid task session parameters.' };
    }

    const task = this.getTaskById(taskId);
    if (!task) {
      activeTaskSessions.delete(taskToken);
      return { success: false, error: 'Task not found' };
    }

    const elapsedMs = Date.now() - session.startedAt;
    const requiredMs = session.durationMs;

    // Strict server-side task duration verification (300ms grace)
    if (elapsedMs < (requiredMs - 300)) {
      return {
        success: false,
        error: `Task timer not finished! Completed in ${(elapsedMs / 1000).toFixed(1)}s, required ${(requiredMs / 1000)}s. Keep the page open to finish.`
      };
    }

    // Check duplicate
    if (!task.isRepeatable) {
      const alreadyDone = this.data.taskCompletions.some(
        (c) => c.userId === userId && c.taskId === taskId && c.status === 'completed'
      );
      if (alreadyDone) {
        activeTaskSessions.delete(taskToken);
        return { success: false, error: 'You have already claimed this task reward.' };
      }
    }

    // Award reward to user
    const user = this.getUserById(userId);
    if (!user) {
      activeTaskSessions.delete(taskToken);
      return { success: false, error: 'User not found' };
    }

    const reward = task.rewardBdt;
    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));
    user.taskEarnings = Number((user.taskEarnings + reward).toFixed(2));
    user.lastActive = new Date().toISOString();

    // Increment task completion counter
    task.completedCount = (task.completedCount || 0) + 1;

    // Record completion
    this.data.taskCompletions.unshift({
      id: `cmp_${Date.now()}`,
      userId: user.id,
      taskId: task.id,
      taskTitle: task.title,
      rewardBdt: reward,
      startedAt: new Date(session.startedAt).toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
    });

    // Record transaction
    this.data.transactions.unshift({
      id: `tx_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'task',
      amount: reward,
      status: 'completed',
      description: `Task reward: ${task.title}`,
      createdAt: new Date().toISOString(),
    });

    // Clean up task session
    activeTaskSessions.delete(taskToken);

    this.saveData();
    return { success: true, rewardBdt: reward, user };
  }

  // --- Math Quiz Tasks (সহজ + অংক, ৳৫ প্রতি অংক, দৈনিক ৫০০টি, ১৫s Adsterra Smartlink) ---
  public getMathTaskStatus(userId: string): {
    dailyLimit: number;
    todayCompleted: number;
    remaining: number;
    rewardBdt: number;
    adDurationSeconds: number;
    smartlinkUrl: string;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = this.data.transactions.filter(
      (t) => t.userId === userId && t.type === 'task' && t.createdAt.startsWith(today)
    ).length;

    const dailyLimit = 500;
    const remaining = Math.max(0, dailyLimit - todayCompleted);

    return {
      dailyLimit,
      todayCompleted,
      remaining,
      rewardBdt: 5.0,
      adDurationSeconds: 15,
      smartlinkUrl: 'https://www.profitableratecpmnetwork.com/zepyk3kzy?key=b88e21c08441dec7aa791cb01d7a6ead',
    };
  }

  public completeMathTask(
    userId: string,
    mathAnswer: number,
    expectedAnswer: number,
    _elapsedSeconds?: number
  ): { success: boolean; rewardBdt?: number; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, error: 'ইউজার পাওয়া যায়নি।' };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = this.data.transactions.filter(
      (t) => t.userId === userId && t.type === 'task' && t.createdAt.startsWith(today)
    ).length;

    if (todayCompleted >= 500) {
      return { success: false, error: 'আজকের ৫০০টি অংক কাজের সীমা পূর্ণ হয়েছে। আগামীকাল আবার চেষ্টা করুন!' };
    }

    if (Number(mathAnswer) !== Number(expectedAnswer)) {
      return { success: false, error: 'ভুল উত্তর! দয়া করে সঠিক যোগফলটি লিখুন।' };
    }

    const reward = 5.0;
    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));
    user.taskEarnings = Number((user.taskEarnings + reward).toFixed(2));
    user.completedTasksCount = (user.completedTasksCount || 0) + 1;
    user.lastActive = new Date().toISOString();

    const txId = `tx_math_${Date.now()}`;
    this.data.transactions.unshift({
      id: txId,
      userId: user.id,
      username: user.username,
      type: 'task',
      amount: reward,
      status: 'completed',
      description: `Math Quiz Task (+৳5.00)`,
      createdAt: new Date().toISOString(),
    });

    this.saveData();
    return { success: true, rewardBdt: reward, user };
  }

  // --- Watch Video Ads ---
  public getWatchAds(): Advertisement[] {
    return this.data.advertisements.filter((a) => a.placement === 'watch_ads' && a.enabled);
  }

  public startAdWatchSession(userId: string, adId: string): { sessionId: string; ad: Advertisement; durationSeconds: number } | { error: string } {
    const ad = this.data.advertisements.find((a) => a.id === adId && a.enabled);
    if (!ad) return { error: 'Ad not found or inactive' };

    // Check user daily watch limit
    const today = new Date().toISOString().split('T')[0];
    const todayViews = this.data.transactions.filter(
      (t) => t.userId === userId && t.type === 'ad' && t.createdAt.startsWith(today)
    ).length;

    const limit = ad.dailyLimit || 500;
    if (todayViews >= limit) {
      return { error: `দৈনিক ৫০০ টি বিজ্ঞাপনের সীমা পূর্ণ হয়েছে। আগামীকাল আবার চেষ্টা করুন!` };
    }

    const sessionId = `watch_${crypto.randomUUID()}`;
    const durationSeconds = ad.durationSeconds || 15;

    activeAdWatchSessions.set(sessionId, {
      sessionId,
      userId,
      adId: ad.id,
      startedAt: Date.now(),
      durationMs: durationSeconds * 1000,
    });

    ad.viewsCount = (ad.viewsCount || 0) + 1;
    this.saveData();

    return {
      sessionId,
      ad,
      durationSeconds,
    };
  }

  public cancelAdWatchSession(sessionId: string): { success: boolean } {
    activeAdWatchSessions.delete(sessionId);
    return { success: true };
  }

  public claimAdReward(sessionId: string, userId: string): { success: boolean; rewardBdt?: number; user?: User; error?: string } {
    const session = activeAdWatchSessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Invalid or expired ad session. Please watch the ad again.' };
    }

    if (session.userId !== userId) {
      return { success: false, error: 'Unauthorized ad session.' };
    }

    const ad = this.data.advertisements.find((a) => a.id === session.adId);
    if (!ad) {
      activeAdWatchSessions.delete(sessionId);
      return { success: false, error: 'Ad was not found' };
    }

    const elapsedMs = Date.now() - session.startedAt;
    const requiredMs = session.durationMs;

    if (elapsedMs < (requiredMs - 300)) {
      activeAdWatchSessions.delete(sessionId);
      return {
        success: false,
        error: `Ad was closed or interrupted! You watched ${(elapsedMs / 1000).toFixed(1)}s of ${ad.durationSeconds}s. No reward credited.`
      };
    }

    const user = this.getUserById(userId);
    if (!user) {
      activeAdWatchSessions.delete(sessionId);
      return { success: false, error: 'User not found' };
    }

    const reward = ad.rewardBdt;
    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));
    user.adEarnings = Number((user.adEarnings + reward).toFixed(2));
    user.lastActive = new Date().toISOString();

    this.data.transactions.unshift({
      id: `tx_ad_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'ad',
      amount: reward,
      status: 'completed',
      description: `Watch & Earn: ${ad.title}`,
      createdAt: new Date().toISOString(),
    });

    activeAdWatchSessions.delete(sessionId);
    this.saveData();
    return { success: true, rewardBdt: reward, user };
  }

  // --- Spin & Earn ---
  public getSpinStatus(userId: string): {
    enabled: boolean;
    dailyLimit: number;
    spinsUsedToday: number;
    spinsRemaining: number;
    requireAdBetweenSpins: boolean;
    adDurationSeconds: number;
    slices: SpinSettings['slices'];
    ad?: Advertisement;
  } {
    const settings = this.data.spinSettings;
    const today = new Date().toISOString().split('T')[0];
    const todaySpins = this.data.spinResults.filter(
      (s) => s.userId === userId && s.spunAt.startsWith(today)
    ).length;

    const limit = settings.dailyLimit || 500;
    const remaining = Math.max(0, limit - todaySpins);
    const activeAd = this.data.advertisements.find((a) => a.enabled !== false) || this.data.advertisements[0];

    return {
      enabled: settings.enabled,
      dailyLimit: limit,
      spinsUsedToday: todaySpins,
      spinsRemaining: remaining,
      requireAdBetweenSpins: settings.requireAdBetweenSpins !== false,
      adDurationSeconds: settings.adDurationSeconds || 15,
      slices: settings.slices,
      ad: activeAd,
    };
  }

  public playSpin(userId: string): {
    success: boolean;
    sliceIndex?: number;
    rewardBdt?: number;
    sliceLabel?: string;
    user?: User;
    error?: string;
  } {
    const settings = this.data.spinSettings;
    if (!settings.enabled) {
      return { success: false, error: 'Lucky Spin is currently paused by admin.' };
    }

    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const status = this.getSpinStatus(userId);
    if (status.spinsRemaining <= 0) {
      return { success: false, error: `You have reached your daily limit of ${settings.dailyLimit} spins. Come back tomorrow!` };
    }

    // Weighted random selection based on probabilities
    const slices = settings.slices;
    const totalProb = slices.reduce((sum, s) => sum + s.probability, 0);
    const rand = Math.random() * totalProb;

    let cumulative = 0;
    let selectedIndex = 0;
    for (let i = 0; i < slices.length; i++) {
      cumulative += slices[i].probability;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const chosenSlice = slices[selectedIndex];
    const reward = chosenSlice.rewardBdt;

    // Credit user wallet
    user.balance = Number((user.balance + reward).toFixed(2));
    user.totalEarned = Number((user.totalEarned + reward).toFixed(2));
    user.spinEarnings = Number((user.spinEarnings + reward).toFixed(2));
    user.lastActive = new Date().toISOString();

    // Record Spin Result
    this.data.spinResults.unshift({
      id: `spn_${Date.now()}`,
      userId: user.id,
      rewardBdt: reward,
      sliceIndex: selectedIndex,
      spunAt: new Date().toISOString(),
    });

    // Record Transaction
    this.data.transactions.unshift({
      id: `tx_spn_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'spin',
      amount: reward,
      status: 'completed',
      description: `Lucky Spin win: ${chosenSlice.label}`,
      createdAt: new Date().toISOString(),
    });

    this.saveData();

    return {
      success: true,
      sliceIndex: selectedIndex,
      rewardBdt: reward,
      sliceLabel: chosenSlice.label,
      user,
    };
  }

  // --- Wallet & Withdrawals ---
  public getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.data.transactions.filter((t) => t.userId === userId);
    }
    return this.data.transactions;
  }

  public getWithdrawals(userId?: string): Withdrawal[] {
    if (userId) {
      return this.data.withdrawals.filter((w) => w.userId === userId);
    }
    return this.data.withdrawals;
  }

  public requestWithdrawal(
    userId: string,
    method: Withdrawal['method'],
    details: Withdrawal['details'],
    amount: number
  ): { success: boolean; withdrawal?: Withdrawal; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const sys = this.data.systemSettings;

    // Method active check
    if (method === 'bKash' && !sys.bKashEnabled) {
      return { success: false, error: 'bKash withdrawals are currently disabled.' };
    }
    if (method === 'Nagad' && !sys.nagadEnabled) {
      return { success: false, error: 'Nagad withdrawals are currently disabled.' };
    }
    if (method === 'USDT' && !sys.usdtEnabled) {
      return { success: false, error: 'USDT withdrawals are currently disabled.' };
    }

    // Amount validation
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Please enter a valid positive withdrawal amount' };
    }

    if (amount < sys.minWithdrawal) {
      return { success: false, error: `Minimum withdrawal amount is ৳${sys.minWithdrawal}` };
    }

    if (amount > sys.maxWithdrawal) {
      return { success: false, error: `Maximum withdrawal limit is ৳${sys.maxWithdrawal}` };
    }

    if (user.balance < amount) {
      return { success: false, error: `Insufficient balance! Your available balance is ৳${user.balance.toFixed(2)}` };
    }

    // Detail validation
    if ((method === 'bKash' || method === 'Nagad') && (!details.accountNumber || details.accountNumber.length < 11)) {
      return { success: false, error: `Please enter a valid 11-digit ${method} phone number.` };
    }

    if (method === 'USDT' && (!details.walletAddress || details.walletAddress.length < 10)) {
      return { success: false, error: 'Please enter a valid USDT TRC20 wallet address.' };
    }

    // Calculate fee
    const fee = Number(((amount * sys.withdrawalFeePercent) / 100).toFixed(2));
    const netAmount = Number((amount - fee).toFixed(2));

    // Deduct from available balance immediately to prevent double spending
    user.balance = Number((user.balance - amount).toFixed(2));
    user.lastActive = new Date().toISOString();

    const withdrawal: Withdrawal = {
      id: `wth_${Date.now()}`,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      method,
      details,
      amount,
      fee,
      netAmount,
      status: 'pending',
      adminNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.withdrawals.unshift(withdrawal);

    // Record pending transaction
    this.data.transactions.unshift({
      id: `tx_wth_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal request to ${method} (${details.accountNumber || details.walletAddress}) - Fee: ৳${fee}`,
      referenceId: withdrawal.id,
      createdAt: new Date().toISOString(),
    });

    this.saveData();
    return { success: true, withdrawal, user };
  }

  public updateWithdrawalStatus(
    withdrawalId: string,
    newStatus: Withdrawal['status'],
    adminUsername: string,
    adminNote?: string
  ): { success: boolean; withdrawal?: Withdrawal; error?: string } {
    const withdrawal = this.data.withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) return { success: false, error: 'Withdrawal not found' };

    const oldStatus = withdrawal.status;
    if (oldStatus === newStatus) {
      withdrawal.adminNote = adminNote || withdrawal.adminNote;
      withdrawal.updatedAt = new Date().toISOString();
      this.saveData();
      return { success: true, withdrawal };
    }

    const user = this.getUserById(withdrawal.userId);

    // If changing to rejected from pending or processing, REFUND the amount to the user!
    if (newStatus === 'rejected' && (oldStatus === 'pending' || oldStatus === 'processing')) {
      if (user) {
        user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
        // Add refund transaction
        this.data.transactions.unshift({
          id: `tx_ref_${Date.now()}`,
          userId: user.id,
          username: user.username,
          type: 'withdrawal_refund',
          amount: withdrawal.amount,
          status: 'completed',
          description: `Withdrawal refund (ID: ${withdrawal.id.slice(-6)}): ${adminNote || 'Rejected by administrator'}`,
          referenceId: withdrawal.id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Update matching transaction status
    const tx = this.data.transactions.find((t) => t.referenceId === withdrawal.id);
    if (tx) {
      if (newStatus === 'completed') tx.status = 'completed';
      if (newStatus === 'rejected') tx.status = 'rejected';
      if (newStatus === 'processing') tx.status = 'pending';
    }

    withdrawal.status = newStatus;
    if (adminNote !== undefined) withdrawal.adminNote = adminNote;
    withdrawal.updatedAt = new Date().toISOString();

    // Log admin action
    this.logAdminAction(
      adminUsername,
      'UPDATE_WITHDRAWAL_STATUS',
      'withdrawal',
      withdrawal.id,
      `Changed withdrawal ${withdrawal.id} status from ${oldStatus} to ${newStatus} for user @${withdrawal.username} (৳${withdrawal.amount}). Note: ${adminNote || 'none'}`
    );

    this.saveData();
    return { success: true, withdrawal };
  }

  // --- Ads Management ---
  public getAdvertisements(): Advertisement[] {
    return this.data.advertisements;
  }

  public createAdvertisement(adData: Omit<Advertisement, 'id' | 'createdAt' | 'viewsCount'>): Advertisement {
    const newAd: Advertisement = {
      ...adData,
      id: `ad_${Date.now()}`,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.advertisements.unshift(newAd);
    this.saveData();
    return newAd;
  }

  public updateAdvertisement(id: string, updates: Partial<Advertisement>): Advertisement | undefined {
    const ad = this.data.advertisements.find((a) => a.id === id);
    if (!ad) return undefined;
    Object.assign(ad, updates);
    this.saveData();
    return ad;
  }

  public deleteAdvertisement(id: string): boolean {
    const idx = this.data.advertisements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.data.advertisements.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Settings ---
  public getSystemSettings(): SystemSettings {
    return this.data.systemSettings;
  }

  public updateSystemSettings(updates: Partial<SystemSettings>, adminUsername: string): SystemSettings {
    Object.assign(this.data.systemSettings, updates);
    this.logAdminAction(
      adminUsername,
      'UPDATE_SYSTEM_SETTINGS',
      'settings',
      'system',
      `Updated platform system settings and thresholds.`
    );
    this.saveData();
    return this.data.systemSettings;
  }

  public getReferralSettings(): ReferralSettings {
    return this.data.referralSettings;
  }

  public updateReferralSettings(updates: Partial<ReferralSettings>, adminUsername: string): ReferralSettings {
    Object.assign(this.data.referralSettings, updates);
    this.logAdminAction(
      adminUsername,
      'UPDATE_REFERRAL_SETTINGS',
      'settings',
      'referral',
      `Updated referral settings: type=${this.data.referralSettings.type}, fixed=৳${this.data.referralSettings.fixedAmount}, rate=${this.data.referralSettings.commissionRate}%`
    );
    this.saveData();
    return this.data.referralSettings;
  }

  public getSpinSettings(): SpinSettings {
    return this.data.spinSettings;
  }

  public updateSpinSettings(updates: Partial<SpinSettings>, adminUsername: string): SpinSettings {
    Object.assign(this.data.spinSettings, updates);
    this.logAdminAction(
      adminUsername,
      'UPDATE_SPIN_SETTINGS',
      'spin',
      'spin_config',
      `Updated spin wheel settings: dailyLimit=${this.data.spinSettings.dailyLimit}, slicesCount=${this.data.spinSettings.slices?.length}`
    );
    this.saveData();
    return this.data.spinSettings;
  }

  // --- Admin Analytics Dashboard ---
  public getAdminAnalytics() {
    const users = this.data.users;
    const tasks = this.data.tasks;
    const taskCompletions = this.data.taskCompletions;
    const withdrawals = this.data.withdrawals;
    const transactions = this.data.transactions;

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const totalTasks = tasks.length;
    const completedTasks = taskCompletions.length;

    const totalRewardsPaid = Number(
      transactions
        .filter((t) => t.amount > 0 && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
        .toFixed(2)
    );

    const pendingWithdrawalsList = withdrawals.filter((w) => w.status === 'pending');
    const pendingWithdrawalsCount = pendingWithdrawalsList.length;
    const pendingWithdrawalsAmount = Number(
      pendingWithdrawalsList.reduce((sum, w) => sum + w.amount, 0).toFixed(2)
    );

    const completedWithdrawalsList = withdrawals.filter((w) => w.status === 'completed');
    const totalWithdrawalsPaid = Number(
      completedWithdrawalsList.reduce((sum, w) => sum + w.amount, 0).toFixed(2)
    );

    const referralEarningsTotal = Number(
      transactions
        .filter((t) => t.type === 'referral' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
        .toFixed(2)
    );

    const adEarningsTotal = Number(
      transactions
        .filter((t) => t.type === 'ad' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
        .toFixed(2)
    );

    // 7-day earning chart data
    const last7Days: { date: string; earnings: number; completions: number; withdrawals: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEarnings = transactions
        .filter((t) => t.createdAt.startsWith(dateStr) && t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);
      const dayCompletions = taskCompletions.filter((c) => c.completedAt.startsWith(dateStr)).length;
      const dayWithdrawals = withdrawals
        .filter((w) => w.createdAt.startsWith(dateStr) && w.status === 'completed')
        .reduce((acc, w) => acc + w.amount, 0);

      last7Days.push({
        date: dateStr.slice(5), // MM-DD
        earnings: Number(dayEarnings.toFixed(2)),
        completions: dayCompletions,
        withdrawals: Number(dayWithdrawals.toFixed(2)),
      });
    }

    return {
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalRewardsPaid,
      pendingWithdrawalsCount,
      pendingWithdrawalsAmount,
      totalWithdrawalsPaid,
      referralEarningsTotal,
      adEarningsTotal,
      chartData: last7Days,
    };
  }
}

export const db = new DatabaseManager();
