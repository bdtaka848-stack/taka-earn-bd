import React from 'react';
import { useApp } from './context/AppContext.js';
import { Navbar } from './components/common/Navbar.js';
import { MobileNav } from './components/common/MobileNav.js';
import { ToastContainer } from './components/common/Toast.js';
import { AdminLoginModal } from './components/admin/AdminLoginModal.js';
import { UserAuthModal } from './components/auth/UserAuthModal.js';
import { UserDashboard } from './components/user/UserDashboard.js';
import { TaskMarketplace } from './components/user/TaskMarketplace.js';
import { WatchAdsSection } from './components/user/WatchAdsSection.js';
import { SpinWheelSection } from './components/user/SpinWheelSection.js';
import { ReferralSection } from './components/user/ReferralSection.js';
import { WalletSection } from './components/user/WalletSection.js';
import { WithdrawalSection } from './components/user/WithdrawalSection.js';
import { ProfileSection } from './components/user/ProfileSection.js';
import { AdminLayout } from './components/admin/AdminLayout.js';
import { ShieldCheck, Lock, Smartphone, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { userView, isAdminMode, user } = useApp();

  const renderUserView = () => {
    switch (userView) {
      case 'home':
        return <UserDashboard />;
      case 'tasks':
        return <TaskMarketplace />;
      case 'watch_ads':
        return <WatchAdsSection />;
      case 'spin':
        return <SpinWheelSection />;
      case 'refer':
        return <ReferralSection />;
      case 'wallet':
        return <WalletSection />;
      case 'withdraw':
        return <WithdrawalSection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Admin Login Dialog */}
      <AdminLoginModal />

      {/* User Login & Registration Dialog */}
      <UserAuthModal />

      {/* Top Navbar */}
      <Navbar />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={isAdminMode ? 'admin-mode' : userView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {isAdminMode ? <AdminLayout /> : renderUserView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Mobile Navigation for Phone Screens */}
      <MobileNav />

      {/* Desktop & Mobile Trust Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ৳
            </div>
            <span>
              © {new Date().getFullYear()} <strong>TakaEarnBD</strong> · Professional Bangladeshi Rewards Ecosystem
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anti-Fraud 10s Server Gate</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>bKash & Nagad</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>USDT (TRC20/BEP20)</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
