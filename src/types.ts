export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  balance: number; // in BDT
  totalEarned: number;
  referralEarnings: number;
  taskEarnings: number;
  adEarnings: number;
  spinEarnings: number;
  referralCode: string;
  referredBy?: string;
  referralsCount: number;
  activeReferralsCount: number;
  status: UserStatus;
  isBlocked?: boolean;
  completedTasksCount?: number;
  totalWithdrawn?: number;
  createdAt: string;
  lastActive: string;
}

export interface Admin {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'moderator';
}

export type TaskCategory = 'social' | 'survey' | 'app_install' | 'read' | 'daily' | 'other';
export type TaskStatus = 'active' | 'inactive';

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardBdt: number;
  durationSeconds: number; // duration user must stay on task
  adRequired: boolean; // default true
  adDurationSeconds: number; // 10 seconds mandatory ad gate
  adId?: string; // configured ad to display
  category: TaskCategory;
  status: TaskStatus;
  isActive?: boolean;
  isRepeatable: boolean;
  actionUrl?: string;
  dailyLimit?: number;
  icon?: string;
  completedCount?: number;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  rewardBdt: number;
  startedAt: string;
  completedAt: string;
  status: 'completed' | 'failed';
}

export type TransactionType =
  | 'task'
  | 'ad'
  | 'spin'
  | 'referral'
  | 'withdrawal'
  | 'withdrawal_refund'
  | 'admin_adjustment';

export type TransactionStatus = 'completed' | 'pending' | 'rejected' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  username?: string;
  type: TransactionType;
  amount: number; // in BDT, positive or negative
  status: TransactionStatus;
  description: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type WithdrawalMethod = 'bKash' | 'Nagad' | 'USDT';
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

export interface WithdrawalDetails {
  accountNumber?: string; // for bKash / Nagad
  network?: string; // for USDT (e.g. TRC20, BEP20)
  walletAddress?: string; // for USDT
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  method: WithdrawalMethod;
  details: WithdrawalDetails;
  amount: number; // requested amount in BDT
  fee: number; // fee in BDT
  feeBdt?: number;
  netAmount: number; // net payout in BDT or equivalent USDT
  status: WithdrawalStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeUsername: string;
  status: 'active' | 'pending';
  rewardBdt: number;
  createdAt: string;
}

export interface ReferralSettings {
  enabled: boolean;
  type: 'fixed' | 'percentage';
  commissionRate: number; // e.g. 10 for 10%
  fixedAmount: number; // e.g. 25 BDT
  minWithdrawalForCommission: number;
}

export interface SpinSlice {
  label: string;
  rewardBdt: number;
  probability: number; // percentage (0 - 100)
  color: string;
  textColor?: string;
}

export interface SpinSettings {
  enabled: boolean;
  dailyLimit: number;
  requireAdBetweenSpins?: boolean;
  adDurationSeconds?: number;
  slices: SpinSlice[];
}

export interface SpinResult {
  id: string;
  userId: string;
  rewardBdt: number;
  sliceIndex: number;
  spunAt: string;
}

export type AdProvider = 'Adsterra' | 'Social Bar' | 'Popunder' | 'Custom HTML' | 'Video CPM' | 'Adsterra Video CPM';
export type AdPlacement = 'before_task' | 'watch_ads' | 'dashboard' | 'popunder';

export interface Advertisement {
  id: string;
  title: string;
  provider: AdProvider;
  codeSnippet: string;
  placement: AdPlacement;
  durationSeconds: number; // e.g. 10 for task gate, 15 for video ad
  rewardBdt: number; // 0 for task gate, >0 for watch ads
  dailyLimit?: number;
  enabled: boolean;
  isActive?: boolean;
  viewsCount?: number;
  createdAt: string;
}

export interface PlatformSettings {
  withdrawal: {
    minAmount: number;
    maxAmount: number;
    feePercent: number;
    usdtExchangeRate: number;
  };
  referral: ReferralSettings;
  spin: SpinSettings;
  announcements: string[];
}

export interface DashboardData {
  stats: {
    balance: number;
    todayEarnings: number;
    totalEarnings: number;
    completedTasks: number;
    referralEarnings: number;
    availableWithdrawal: number;
    totalWithdrawn: number;
  };
  recentTransactions: Transaction[];
  announcements: string[];
}

export interface SystemSettings {
  siteName: string;
  currencySymbol: string; // '৳'
  currencyCode: string; // 'BDT'
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  bKashEnabled: boolean;
  nagadEnabled: boolean;
  usdtEnabled: boolean;
  usdtExchangeRate: number; // 1 USDT = ~122 BDT
  // Payment Gateway settings for real API integration
  bKashApiUrl: string;
  bKashMerchantNumber: string;
  nagadMerchantId: string;
  usdtTrc20Address: string;
  adsterraPublisherId: string;
  socialBarZoneId: string;
  popunderZoneId: string;
}

export interface AuditLog {
  id: string;
  adminUsername: string;
  action: string;
  targetType: 'user' | 'withdrawal' | 'task' | 'ad' | 'settings' | 'spin';
  targetId: string;
  details: string;
  ip?: string;
  createdAt: string;
}

// Server-side Gate & Task Sessions
export interface AdGateSession {
  sessionId: string;
  userId: string;
  taskId: string;
  adId: string;
  startedAt: number; // unix timestamp ms
  durationSeconds: number;
}

export interface TaskSession {
  token: string;
  userId: string;
  taskId: string;
  startedAt: number; // unix timestamp ms
  requiredDurationSeconds: number;
}
