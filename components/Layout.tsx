import React from 'react';
import { AppScreen } from '../types';
import { Home, Award, Wind, Crosshair } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate }) => {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-dark shadow-2xl border-x border-gold/10">
      <header className="p-4 border-b border-gold/20 flex justify-between items-center bg-black text-gold sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic">Syclar</h1>
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