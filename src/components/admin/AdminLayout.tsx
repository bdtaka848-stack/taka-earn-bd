import React from 'react';
import { useApp, AdminView } from '../../context/AppContext.js';
import { AdminDashboardOverview } from './AdminDashboardOverview.js';
import { AdminTaskManagement } from './AdminTaskManagement.js';
import { AdminUserManagement } from './AdminUserManagement.js';
import { AdminWithdrawalManagement } from './AdminWithdrawalManagement.js';
import { AdminAdManagement } from './AdminAdManagement.js';
import { AdminPlatformSettings } from './AdminPlatformSettings.js';
import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  ArrowDownLeft,
  Tv,
  Sliders,
  Shield,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { adminView, setAdminView, setIsAdminMode, adminLogout } = useApp();

  const navItems: Array<{ id: AdminView; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks Manager', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'withdrawals', label: 'Withdrawal Payouts', icon: <ArrowDownLeft className="w-4 h-4" /> },
    { id: 'ads', label: 'Adsterra & CPM Ads', icon: <Tv className="w-4 h-4" /> },
    { id: 'settings', label: 'Platform Economics', icon: <Sliders className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (adminView) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'tasks':
        return <AdminTaskManagement />;
      case 'users':
        return <AdminUserManagement />;
      case 'withdrawals':
        return <AdminWithdrawalManagement />;
      case 'ads':
        return <AdminAdManagement />;
      case 'settings':
        return <AdminPlatformSettings />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Subheader & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User App</span>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
        </div>

        <button
          onClick={adminLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {navItems.map((item) => {
          const isActive = adminView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAdminView(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Admin View Content */}
      <div>{renderContent()}</div>
    </div>
  );
};
