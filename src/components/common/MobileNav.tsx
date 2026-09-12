import React from 'react';
import { useApp, UserView } from '../../context/AppContext.js';
import { Flame, CheckCircle2, Tv, Sparkles, Wallet, ArrowDownLeft } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { userView, setUserView, isAdminMode } = useApp();

  if (isAdminMode) return null;

  const items: Array<{ key: UserView; label: string; icon: React.ReactNode }> = [
    { key: 'home', label: 'Home', icon: <Flame className="w-5 h-5" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle2 className="w-5 h-5" /> },
    { key: 'watch_ads', label: 'Ads', icon: <Tv className="w-5 h-5" /> },
    { key: 'spin', label: 'Spin', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'withdraw', label: 'Cashout', icon: <ArrowDownLeft className="w-5 h-5" /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2"
    >
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = userView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setUserView(item.key)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={isActive ? 'scale-110 transition-transform' : ''}>
                {item.icon}
              </div>
              <span className="mt-1 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
