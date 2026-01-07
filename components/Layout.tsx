import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppScreen } from '../types';
import { Home, Award, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const handleSettings = () => {
    navigate('/account');
    setMenuOpen(false);
  };

  // Get user initials for profile circle
  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-dark shadow-2xl border-x border-gold/10">
      <header className="p-4 border-b border-gold/20 flex justify-between items-center bg-black text-gold sticky top-0 z-10 shadow-lg">
        <div className="flex items-center space-x-3">
          {/* Profile Circle Button */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:bg-gold/30 transition-all active:scale-95 text-gold font-bold text-xs"
            >
              {getInitials()}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute top-full left-0 mt-2 w-48 bg-black border border-gold/20 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="py-1">
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-gold/10 transition-colors text-gold"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-semibold">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-red-500/10 transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Syclar</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-gold animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Premium Coach</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-dark custom-scrollbar">
        {children}
      </main>

      <nav className="border-t border-gold/20 p-2 flex justify-around items-center bg-black sticky bottom-0 z-20">
        <NavButton 
          active={activeScreen === AppScreen.BASE} 
          onClick={() => onNavigate(AppScreen.BASE)}
          icon={<Home size={20} />}
          label="Base"
        />
        <NavButton 
          active={activeScreen === AppScreen.ACHIEVEMENTS} 
          onClick={() => onNavigate(AppScreen.ACHIEVEMENTS)}
          icon={<Award size={20} />}
          label="Stats"
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center px-1 py-2 rounded-lg transition-all min-w-[60px] ${active ? 'text-gold scale-110' : 'text-gray-600 hover:text-gold/60'}`}
  >
    {icon}
    <span className="text-[8px] mt-1 font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default Layout;