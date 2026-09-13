import express, { Request, Response } from 'express';
import { db } from '../db.js';

const router = express.Router();

// Middleware: Extract current user (defaults to sabbir_khan demo user if no header)
function getUser(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || 'usr_demo_1';
  return db.getUserById(userId) || db.getUsers()[0];
}

// Middleware: Admin auth check
function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== 'admin_session_token_demo_verified') {
    return res.status(401).json({ error: 'Unauthorized: Admin login required' });
  }
  next();
}

// ==========================================
// PUBLIC SETTINGS & INITIAL STATE
// ==========================================
router.get('/settings/public', (req, res) => {
  const sys = db.getSystemSettings();
  const ref = db.getReferralSettings();
  res.json({
    siteName: sys.siteName,
    currencySymbol: sys.currencySymbol,
    currencyCode: sys.currencyCode,
    minWithdrawal: sys.minWithdrawal,
    maxWithdrawal: sys.maxWithdrawal,
    withdrawalFeePercent: sys.withdrawalFeePercent,
    bKashEnabled: sys.bKashEnabled,
    nagadEnabled: sys.nagadEnabled,
    usdtEnabled: sys.usdtEnabled,
    usdtExchangeRate: sys.usdtExchangeRate,
    referral: {
      enabled: ref.enabled,
      type: ref.type,
      fixedAmount: ref.fixedAmount,
      commissionRate: ref.commissionRate,
    },
  });
});

// ==========================================
// USER AUTHENTICATION & SWITCHING
// ==========================================
router.get('/auth/me', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.post('/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  if (!username) {
    return res.status(400).json({ error: 'Admin Username প্রদান করা আবশ্যক।' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Admin Password প্রদান করা আবশ্যক।' });
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(404).json({
      error: 'এই Admin Username দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক ইউজারনেম দিন অথবা নতুন রেজিস্ট্রেশন করুন।',
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি প্রশাসন কর্তৃক স্থগিত (Suspended) করা হয়েছে।' });
  }

  const userPassword = user.password || '123456';
  if (userPassword !== password) {
    return res.status(401).json({
      error: 'ভুল Admin Password! সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন (পাসওয়ার্ড ৬-১২ অক্ষরের হতে হবে)।',
    });
  }

  res.json({ success: true, user, message: 'সফলভাবে লগইন হয়েছে!' });
});

router.post('/auth/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const referralCode = req.body.referralCode ? String(req.body.referralCode).trim() : undefined;

  // 1. Validate Admin Username (8 to 16 digits/numbers only)
  if (!username) {
    return res.status(400).json({ error: 'Admin Username পূরণ করা আবশ্যক।' });
  }
  if (!/^\d{8,16}$/.test(username)) {
    return res.status(400).json({
      error: 'Admin Username অপশনে শুধুমাত্র ৮ থেকে ১৬টি সংখ্যা (0-9) বসাতে পারবেন। অক্ষর বা স্পেস গ্রহণযোগ্য নয়। যেমন: 01712345678 বা 12345678',
    });
  }

  // 2. Uniqueness check (No two users can have the same Username)
  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({
      error: 'এই Admin Username টি ইতিমধ্যে নিবন্ধিত রয়েছে! প্রতিটি ব্যবহারকারীর আলাদা ইউনিক ইউজারনেম থাকতে হবে। অনুগ্রহ করে অন্য একটি সংখ্যা বা মোবাইল নম্বর দিন।',
    });
  }

  // 3. Validate Admin Password (6 to 12 characters)
  if (!password) {
    return res.status(400).json({ error: 'Admin Password পূরণ করা আবশ্যক।' });
  }
  if (password.length < 6 || password.length > 12) {
    return res.status(400).json({
      error: 'Admin Password অবশ্যই ৬ থেকে ১২ সংখ্যার বা অক্ষরের মধ্যে হতে হবে।',
    });
  }

  const newUser = db.createUser({
    username,
    password,
    name: name || `User ${username.slice(-4)}`,
    email: email || `${username}@takaearn.bd`,
    phone: phone || username,
    referredBy: referralCode,
  });

  res.status(201).json({
    success: true,
    user: newUser,
    message: 'অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
  });
});

router.get('/auth/check-username/:username', (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!/^\d{8,16}$/.test(username)) {
    return res.json({
      valid: false,
      available: false,
      message: 'ইউজারনেমে শুধুমাত্র ৮ থেকে ১৬টি সংখ্যা হতে হবে।',
    });
  }
  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.json({
      valid: true,
      available: false,
      message: 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে। অন্য সংখ্যা দিন।',
    });
  }
  return res.json({
    valid: true,
    available: true,
    message: 'এই ইউজারনেমটি উপলব্ধ আছে!',
  });
});

router.get('/auth/users-list', (req, res) => {
  // Demo helper to allow quick switching between demo profiles
  const users = db.getUsers().map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    balance: u.balance,
  }));
  res.json({ users });
});

// ==========================================
// USER DASHBOARD
// ==========================================
router.get('/user/dashboard', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Calculate today's earnings
  const today = new Date().toISOString().split('T')[0];
  const userTxs = db.getTransactions(user.id);
  const todayEarnings = Number(
    userTxs
      .filter((t) => t.createdAt.startsWith(today) && t.amount > 0 && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2)
  );

  const pendingWithdrawalSum = Number(
    db
      .getWithdrawals(user.id)
      .filter((w) => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amount, 0)
      .toFixed(2)
  );

  const completedTasksCount = db
    .getRaw()
    .taskCompletions.filter((c) => c.userId === user.id && c.status === 'completed').length;

  const recentTransactions = userTxs.slice(0, 5);

  // Active dashboard advertisement
  const dashboardAd = db
    .getAdvertisements()
    .find((a) => a.placement === 'dashboard' && a.enabled);

  res.json({
    user,
    todayEarnings,
    totalEarnings: user.totalEarned,
    completedTasksCount,
    referralEarnings: user.referralEarnings,
    availableBalance: user.balance,
    pendingWithdrawalSum,
    recentTransactions,
    dashboardAd,
  });
});

// ==========================================
// TASKS & MANDATORY 10-SECOND AD GATE
// ==========================================
router.get('/tasks', (req, res) => {
  const user = getUser(req);
  const tasks = db.getTasks(user?.id);
  res.json({ tasks });
});

// 1. Start Ad Gate before task
router.post('/tasks/:id/start-ad-gate', (req, res) => {
  const user = getUser(req);
  const taskId = req.params.id;

  const result = db.startAdGate(user.id, taskId);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// 2. Cancel Ad Gate (if user closed or navigated away)
router.post('/tasks/cancel-ad-gate', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    db.cancelAdGate(sessionId);
  }
  res.json({ success: true, message: 'Ad gate session cancelled' });
});

// 3. Verify Ad Gate on Server (Must be >= 10 seconds)
router.post('/tasks/verify-ad-gate', (req, res) => {
  const user = getUser(req);
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Ad gate session ID is required' });
  }

  const result = db.verifyAdGate(sessionId, user.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// 4. Complete Task (Server verifies task token + required duration)
router.post('/tasks/:id/complete', (req, res) => {
  const user = getUser(req);
  const taskId = req.params.id;
  const { taskToken } = req.body;

  if (!taskToken) {
    return res.status(400).json({ error: 'Task session token is missing. You must watch the 10s ad first.' });
  }

  const result = db.completeTask(taskToken, user.id, taskId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// ==========================================
// MATH QUIZ TASKS (সহজ + অংক, ৳৫ প্রতি অংক, দৈনিক ৫০০টি, ১৫s স্পন্সর)
// ==========================================
router.get('/tasks/math-status', (req, res) => {
  const user = getUser(req);
  const status = db.getMathTaskStatus(user.id);
  res.json(status);
});

router.post('/tasks/math-submit', (req, res) => {
  const user = getUser(req);
  const { mathAnswer, expectedAnswer, elapsedSeconds } = req.body;

  if (mathAnswer === undefined || expectedAnswer === undefined) {
    return res.status(400).json({ error: 'অংকের উত্তর প্রদান আবশ্যক।' });
  }

  const result = db.completeMathTask(
    user.id,
    Number(mathAnswer),
    Number(expectedAnswer),
    Number(elapsedSeconds || 15)
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// ==========================================
// WATCH VIDEO ADS
// ==========================================
router.get('/ads/watch-list', (req, res) => {
  const user = getUser(req);
  const ads = db.getWatchAds();
  const today = new Date().toISOString().split('T')[0];
  const todayWatched = db.getTransactions().filter(
    (t) => t.userId === user.id && t.type === 'ad' && t.createdAt.startsWith(today)
  ).length;
  const dailyLimit = ads[0]?.dailyLimit || 500;
  const remaining = Math.max(0, dailyLimit - todayWatched);

  res.json({
    ads,
    dailyLimit,
    todayWatched,
    remaining,
  });
});

router.post('/ads/:id/start-watch', (req, res) => {
  const user = getUser(req);
  const adId = req.params.id;

  const result = db.startAdWatchSession(user.id, adId);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

router.post('/ads/cancel-watch', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    db.cancelAdWatchSession(sessionId);
  }
  res.json({ success: true });
});

router.post('/ads/claim-reward', (req, res) => {
  const user = getUser(req);
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Watch session ID is required' });
  }

  const result = db.claimAdReward(sessionId, user.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// ==========================================
// SPIN & EARN
// ==========================================
router.get('/spin/status', (req, res) => {
  const user = getUser(req);
  const status = db.getSpinStatus(user.id);
  res.json(status);
});

router.post('/spin/play', (req, res) => {
  const user = getUser(req);
  const result = db.playSpin(user.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// ==========================================
// REFERRAL SYSTEM
// ==========================================
router.get('/referrals', (req, res) => {
  const user = getUser(req);
  const allRefs = db.getRaw().referrals.filter((r) => r.referrerId === user.id);
  const refSettings = db.getReferralSettings();

  res.json({
    referralCode: user.referralCode,
    totalReferrals: user.referralsCount,
    activeReferrals: user.activeReferralsCount,
    referralEarnings: user.referralEarnings,
    settings: refSettings,
    history: allRefs,
  });
});

router.post('/referrals/apply', (req, res) => {
  const user = getUser(req);
  const { referralCode } = req.body;
  if (!referralCode || typeof referralCode !== 'string') {
    return res.status(400).json({ error: 'রেফার কোড দেওয়া আবশ্যক (Referral code is required)' });
  }

  const result = db.applyReferral(user.id, referralCode);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ success: true, message: result.message, reward: result.reward });
});

router.post('/referrals/invite-friend', (req, res) => {
  const user = getUser(req);
  const { friendName } = req.body;

  const result = db.simulateReferralInvite(user.id, friendName);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  const updatedUser = db.getUserById(user.id);
  res.json({
    success: true,
    message: result.message,
    reward: result.reward,
    refereeUsername: result.refereeUsername,
    user: updatedUser,
  });
});

// ==========================================
// WALLET & WITHDRAWAL
// ==========================================
router.get('/wallet', (req, res) => {
  const user = getUser(req);
  const transactions = db.getTransactions(user.id);
  const withdrawals = db.getWithdrawals(user.id);

  const pendingWithdrawalTotal = Number(
    withdrawals
      .filter((w) => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amount, 0)
      .toFixed(2)
  );

  const completedWithdrawalsTotal = Number(
    withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0)
      .toFixed(2)
  );

  res.json({
    availableBalance: user.balance,
    pendingBalance: pendingWithdrawalTotal,
    totalEarned: user.totalEarned,
    totalWithdrawn: completedWithdrawalsTotal,
    referralEarnings: user.referralEarnings,
    taskEarnings: user.taskEarnings,
    adEarnings: user.adEarnings,
    spinEarnings: user.spinEarnings,
    transactions,
    withdrawals,
  });
});

router.post('/wallet/withdraw', (req, res) => {
  const user = getUser(req);
  const { method, details, amount } = req.body;

  if (!method || !details || !amount) {
    return res.status(400).json({ error: 'Method, account details, and amount are required' });
  }

  const result = db.requestWithdrawal(user.id, method, details, Number(amount));
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// ==========================================
// ADMIN AUTHENTICATION
// Demo credentials: demo / 123456
// ==========================================
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.ADMIN_USERNAME || 'demo';
  const envPass = process.env.ADMIN_PASSWORD || '123456';

  if (username === envUser && password === envPass) {
    db.logAdminAction(
      username,
      'ADMIN_LOGIN_SUCCESS',
      'settings',
      'auth',
      `Admin logged in successfully from IP ${req.ip || '127.0.0.1'}`
    );
    return res.json({
      success: true,
      token: 'admin_session_token_demo_verified',
      admin: {
        username: 'demo',
        name: 'TakaEarnBD Administrator',
        role: 'super_admin',
      },
    });
  }

  return res.status(401).json({ error: 'Invalid admin username or password.' });
});

router.get('/admin/me', requireAdmin, (req, res) => {
  res.json({
    admin: {
      username: 'demo',
      name: 'TakaEarnBD Administrator',
      role: 'super_admin',
    },
  });
});

// ==========================================
// ADMIN DASHBOARD & ANALYTICS
// ==========================================
router.get('/admin/analytics', requireAdmin, (req, res) => {
  const analytics = db.getAdminAnalytics();
  res.json(analytics);
});

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================
router.get('/admin/users', requireAdmin, (req, res) => {
  const users = db.getUsers();
  res.json({ users });
});

router.get('/admin/users/:id', requireAdmin, (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const transactions = db.getTransactions(user.id);
  const withdrawals = db.getWithdrawals(user.id);
  const completions = db
    .getRaw()
    .taskCompletions.filter((c) => c.userId === user.id);
  res.json({ user, transactions, withdrawals, completions });
});

router.post('/admin/users/:id/balance', requireAdmin, (req, res) => {
  const { deltaAmount, reason } = req.body;
  if (deltaAmount === undefined || isNaN(Number(deltaAmount))) {
    return res.status(400).json({ error: 'Valid delta amount is required' });
  }

  const result = db.adjustUserBalance(
    req.params.id,
    Number(deltaAmount),
    'demo',
    reason || 'Manual administrator balance adjustment'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

router.post('/admin/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const user = db.updateUser(req.params.id, { status });
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.logAdminAction(
    'demo',
    'USER_STATUS_CHANGE',
    'user',
    user.id,
    `Updated status of user @${user.username} to ${status}`
  );

  res.json({ success: true, user });
});

// ==========================================
// ADMIN TASK MANAGEMENT
// ==========================================
router.post('/admin/tasks', requireAdmin, (req, res) => {
  const {
    title,
    description,
    rewardBdt,
    durationSeconds,
    adRequired,
    adDurationSeconds,
    adId,
    category,
    status,
    isRepeatable,
    dailyLimit,
    icon,
  } = req.body;

  if (!title || !description || rewardBdt === undefined || durationSeconds === undefined) {
    return res.status(400).json({ error: 'Title, description, reward, and duration are required' });
  }

  const newTask = db.createTask({
    title,
    description,
    rewardBdt: Number(rewardBdt),
    durationSeconds: Number(durationSeconds),
    adRequired: adRequired ?? true,
    adDurationSeconds: Number(adDurationSeconds || 10),
    adId: adId || 'ad_gate_default',
    category: category || 'social',
    status: status || 'active',
    isRepeatable: Boolean(isRepeatable),
    dailyLimit: Number(dailyLimit || 1),
    icon: icon || 'CheckCircle',
  });

  db.logAdminAction(
    'demo',
    'CREATE_TASK',
    'task',
    newTask.id,
    `Created task "${newTask.title}" (Reward: ৳${newTask.rewardBdt}, Ad Gate: ${newTask.adDurationSeconds}s)`
  );

  res.status(201).json({ task: newTask });
});

router.put('/admin/tasks/:id', requireAdmin, (req, res) => {
  const updated = db.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });

  db.logAdminAction(
    'demo',
    'UPDATE_TASK',
    'task',
    updated.id,
    `Updated task "${updated.title}"`
  );

  res.json({ task: updated });
});

router.delete('/admin/tasks/:id', requireAdmin, (req, res) => {
  const task = db.getTaskById(req.params.id);
  const success = db.deleteTask(req.params.id);
  if (!success) return res.status(404).json({ error: 'Task not found' });

  db.logAdminAction(
    'demo',
    'DELETE_TASK',
    'task',
    req.params.id,
    `Deleted task "${task?.title || req.params.id}"`
  );

  res.json({ success: true });
});

// ==========================================
// ADMIN WITHDRAWALS MANAGEMENT
// ==========================================
router.get('/admin/withdrawals', requireAdmin, (req, res) => {
  const withdrawals = db.getWithdrawals();
  res.json({ withdrawals });
});

router.post('/admin/withdrawals/:id/status', requireAdmin, (req, res) => {
  const { status, adminNote } = req.body;
  if (!['pending', 'approved', 'processing', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid withdrawal status' });
  }

  const result = db.updateWithdrawalStatus(req.params.id, status, 'demo', adminNote);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// ==========================================
// ADMIN ADS MANAGEMENT
// ==========================================
router.get('/admin/ads', requireAdmin, (req, res) => {
  const ads = db.getAdvertisements();
  res.json({ ads });
});

router.post('/admin/ads', requireAdmin, (req, res) => {
  const { title, provider, codeSnippet, placement, durationSeconds, rewardBdt, dailyLimit, enabled } = req.body;
  if (!title || !provider || !codeSnippet || !placement) {
    return res.status(400).json({ error: 'Title, provider, placement and code snippet are required' });
  }

  const newAd = db.createAdvertisement({
    title,
    provider,
    codeSnippet,
    placement,
    durationSeconds: Number(durationSeconds || 10),
    rewardBdt: Number(rewardBdt || 0),
    dailyLimit: Number(dailyLimit || 100),
    enabled: enabled ?? true,
  });

  db.logAdminAction(
    'demo',
    'CREATE_ADVERTISEMENT',
    'ad',
    newAd.id,
    `Created ad "${newAd.title}" (${newAd.provider}, ${newAd.placement})`
  );

  res.status(201).json({ ad: newAd });
});

router.put('/admin/ads/:id', requireAdmin, (req, res) => {
  const updated = db.updateAdvertisement(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Advertisement not found' });

  db.logAdminAction(
    'demo',
    'UPDATE_ADVERTISEMENT',
    'ad',
    updated.id,
    `Updated ad "${updated.title}"`
  );

  res.json({ ad: updated });
});

router.delete('/admin/ads/:id', requireAdmin, (req, res) => {
  const ad = db.getAdvertisements().find((a) => a.id === req.params.id);
  const success = db.deleteAdvertisement(req.params.id);
  if (!success) return res.status(404).json({ error: 'Ad not found' });

  db.logAdminAction(
    'demo',
    'DELETE_ADVERTISEMENT',
    'ad',
    req.params.id,
    `Deleted ad "${ad?.title || req.params.id}"`
  );

  res.json({ success: true });
});

// ==========================================
// ADMIN REWARD & REFERRAL SETTINGS
// ==========================================
router.get('/admin/referrals', requireAdmin, (req, res) => {
  const settings = db.getReferralSettings();
  const allRefs = db.getRaw().referrals;
  res.json({ settings, referrals: allRefs });
});

router.post('/admin/referrals/settings', requireAdmin, (req, res) => {
  const updated = db.updateReferralSettings(req.body, 'demo');
  res.json({ settings: updated });
});

// ==========================================
// ADMIN SPIN WHEEL SETTINGS
// ==========================================
router.get('/admin/spin', requireAdmin, (req, res) => {
  const spinSettings = db.getSpinSettings();
  const results = db.getRaw().spinResults.slice(0, 50);
  res.json({ spinSettings, recentSpins: results });
});

router.post('/admin/spin/settings', requireAdmin, (req, res) => {
  const updated = db.updateSpinSettings(req.body, 'demo');
  res.json({ spinSettings: updated });
});

// ==========================================
// ADMIN TRANSACTIONS & AUDIT LOGS
// ==========================================
router.get('/admin/transactions', requireAdmin, (req, res) => {
  const transactions = db.getTransactions();
  res.json({ transactions });
});

router.get('/admin/audit-logs', requireAdmin, (req, res) => {
  const logs = db.getAuditLogs();
  res.json({ auditLogs: logs });
});

// ==========================================
// ADMIN SYSTEM SETTINGS & GATEWAY CONFIG
// ==========================================
router.get('/admin/settings', requireAdmin, (req, res) => {
  const sys = db.getSystemSettings();
  const ref = db.getReferralSettings();
  const spin = db.getSpinSettings();
  res.json({
    settings: {
      withdrawal: {
        minAmount: sys.minWithdrawal,
        maxAmount: sys.maxWithdrawal,
        feePercent: sys.withdrawalFeePercent,
        usdtExchangeRate: sys.usdtExchangeRate,
      },
      referral: ref,
      spin: spin,
      announcements: ['Welcome to TakaEarnBD! Watch sponsor ads and earn BDT every 10 seconds.'],
    },
    systemSettings: sys,
  });
});

const handleUpdateAdminSettings = (req: any, res: any) => {
  const body = req.body;
  if (body.withdrawal) {
    db.updateSystemSettings(
      {
        minWithdrawal: Number(body.withdrawal.minAmount) || 2000,
        maxWithdrawal: Number(body.withdrawal.maxAmount) || 20000,
        withdrawalFeePercent: Number(body.withdrawal.feePercent) ?? 2.5,
        usdtExchangeRate: Number(body.withdrawal.usdtExchangeRate) || 122,
      },
      'demo'
    );
  } else if (body.minWithdrawal !== undefined || body.maxWithdrawal !== undefined) {
    db.updateSystemSettings(body, 'demo');
  }

  if (body.referral) {
    db.updateReferralSettings(body.referral, 'demo');
  }

  if (body.spin) {
    db.updateSpinSettings(body.spin, 'demo');
  }

  const sys = db.getSystemSettings();
  const ref = db.getReferralSettings();
  const spin = db.getSpinSettings();
  const formatted = {
    withdrawal: {
      minAmount: sys.minWithdrawal,
      maxAmount: sys.maxWithdrawal,
      feePercent: sys.withdrawalFeePercent,
      usdtExchangeRate: sys.usdtExchangeRate,
    },
    referral: ref,
    spin: spin,
    announcements: body.announcements || ['Welcome to TakaEarnBD! Watch sponsor ads and earn BDT every 10 seconds.'],
  };

  res.json({ success: true, settings: formatted, systemSettings: sys });
};

router.put('/admin/settings', requireAdmin, handleUpdateAdminSettings);
router.post('/admin/settings', requireAdmin, handleUpdateAdminSettings);

export default router;
