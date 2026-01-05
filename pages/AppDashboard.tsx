import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import App from '../App';
import { Flame, Crown, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const AppDashboard: React.FC = () => {
  const { isTrialing, trialDaysRemaining, signOut, profile } = useAuth();

  return (
    <div className="relative">
      {/* Trial Banner */}
      {isTrialing && trialDaysRemaining > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gold/20 to-gold/10 border-b border-gold/30">
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold text-gold">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in trial
              </span>
            </div>
            <Link 
              to="/account"
              className="text-[10px] font-bold text-gold/80 hover:text-gold transition uppercase tracking-wider"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Active Subscription Badge */}
      {profile?.subscription_status === 'active' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gold/10 to-transparent">
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold text-gold/80">Premium Member</span>
            </div>
            <Link 
              to="/account"
              className="p-1.5 hover:bg-white/5 rounded-lg transition"
            >
              <Settings className="w-4 h-4 text-white/40 hover:text-white/60" />
            </Link>
          </div>
        </div>
      )}

      {/* Main App - add padding for banner */}
      <div className={isTrialing || profile?.subscription_status === 'active' ? 'pt-10' : ''}>
        <App />
      </div>
    </div>
  );
};

export default AppDashboard;


