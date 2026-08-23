import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  ListOrdered, 
  BookOpen, 
  Sparkles, 
  Scan, 
  Calculator, 
  Coins, 
  Settings, 
  Anchor,
  HelpCircle,
  FileCheck2,
  Car,
  Clock,
  Scale,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  simulationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, simulationsCount }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'new-simulation',
      label: 'Nouvelle simulation',
      icon: FileCheck2,
      badge: 'Calculateur'
    },
    {
      id: 'simulations',
      label: 'Mes simulations',
      icon: ListOrdered,
      badge: simulationsCount > 0 ? simulationsCount : null
    },
    {
      id: 'vehicle-calc',
      label: 'Véhicules & Engins',
      icon: Car,
      badge: 'Argus DGDA'
    },
    {
      id: 'demurrage-calc',
      label: 'Surestaries & Port',
      icon: Clock,
      badge: 'MGT/SCTP'
    },
    {
      id: 'regimes-compare',
      label: 'Comparateur Régimes',
      icon: Scale,
      badge: 'IM4/IM5'
    },
    {
      id: 'procedures-guide',
      label: 'Guide & Procédures',
      icon: GraduationCap,
      badge: 'Checklist'
    },
    {
      id: 'tarif',
      label: 'Tarif Douanier SH 2022',
      icon: BookOpen,
      badge: 'DGDA'
    },
    {
      id: 'ai-assistant',
      label: 'Assistant SH (IA)',
      icon: Sparkles,
      badge: 'Expert'
    },
    {
      id: 'scanner',
      label: 'Scanner Factures / BL',
      icon: Scan,
      badge: 'OCR'
    },
    {
      id: 'quick-calc',
      label: 'Calculateur Rapide',
      icon: Calculator,
      badge: null
    },
    {
      id: 'rates',
      label: 'Taux de change',
      icon: Coins,
      badge: 'USD/CDF'
    },
    {
      id: 'admin',
      label: 'Administration & Règles',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside id="main-sidebar" className="w-full md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0">
      
      {/* Top Port Badge */}
      <div className="p-4 border-b border-slate-800 hidden md:block">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Anchor className="w-4 h-4 text-blue-400" />
            <span>Port Principal : Matadi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            Tarif DGDA SH 2022 • RDC
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 hidden md:block">
        <div className="flex items-center justify-between text-slate-500">
          <span>Version Système :</span>
          <span className="font-mono text-slate-400">v2.4 (SH 2022)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Source :</span>
          <span className="text-amber-400 font-medium">DGDA RDC</span>
        </div>
      </div>
    </aside>
  );
};
