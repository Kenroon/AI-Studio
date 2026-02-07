
import React from 'react';
import { AppSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: AppSettings;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, settings }) => {
  const isDark = settings.theme === 'dark';
  const accent = settings.accentColor;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1c1c1e] text-white' : 'bg-[#f2f2f7] text-black'} pb-24`} style={{ '--accent-color': accent } as React.CSSProperties}>
      <main className="flex-1 w-full max-w-lg mx-auto p-4">
        {children}
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 border-t safe-bottom z-40 transition-colors duration-300 ${isDark ? 'bg-[#1c1c1e]/80 border-gray-800' : 'bg-white/85 border-gray-200'} backdrop-blur-xl`}>
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          <TabButton 
            active={activeTab === 'routines'} 
            onClick={() => setActiveTab('routines')} 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
            label="Rutinas"
            accent={accent}
          />
          <TabButton 
            active={activeTab === 'exercises'} 
            onClick={() => setActiveTab('exercises')} 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            label="Librería"
            accent={accent}
          />
          <TabButton 
            active={activeTab === 'weight'} 
            onClick={() => setActiveTab('weight')} 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
            label="Peso"
            accent={accent}
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Historial"
            accent={accent}
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Ajustes"
            accent={accent}
          />
        </div>
      </nav>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; accent: string }> = ({ active, onClick, icon, label, accent }) => (
  <button 
    onClick={onClick}
    className={`flex-col items-center justify-center space-y-1 transition-all flex flex-1 ${active ? 'scale-110' : 'text-gray-400 opacity-60'}`}
    style={{ color: active ? accent : undefined }}
  >
    {icon}
    <span className="text-[8px] font-black tracking-tight uppercase">{label}</span>
  </button>
);
