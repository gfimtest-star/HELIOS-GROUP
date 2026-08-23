import React from 'react';
import { Shield, Sparkles, Scan, Plus, Globe, RefreshCw, ChevronDown, UserCheck } from 'lucide-react';
import { ExchangeRateConfig } from '../types/customs';

interface NavbarProps {
  currentRate: ExchangeRateConfig;
  userRole: string;
  setUserRole: (role: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRate,
  userRole,
  setUserRole,
  activeTab,
  setActiveTab,
  onOpenAiAssistant,
  onOpenScanner
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* DRC National Color Ribbon */}
      <div className="h-1 w-full grid grid-cols-3">
        <div className="bg-blue-600"></div>
        <div className="bg-amber-400"></div>
        <div className="bg-red-600"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center border border-blue-400/30 shadow-inner group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  DOUANE CALCUL <span className="text-amber-400">RDC</span>
                </span>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded font-mono font-medium hidden sm:inline-block">
                  SH 2022
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[240px] sm:max-w-none">
                Simulateur de pré-dédouanement — Port de Matadi
              </p>
            </div>
          </div>

          {/* Center Info : Live Exchange Rate & Port */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Taux DGDA/BCC :</span>
              <span className="font-bold text-amber-400 font-mono">1 USD = {currentRate?.usd_to_cdf?.toLocaleString('fr-CD')} CDF</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Port de Matadi (CDMAT)</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick AI Classification */}
            <button
              id="nav-btn-ai-assistant"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs font-semibold transition shadow-xs hover:text-white cursor-pointer"
              title="Assistant IA pour identifier le code SH 8 chiffres officiel"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Assistant SH</span>
            </button>

            {/* OCR Document Scanner */}
            <button
              id="nav-btn-scanner"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition hover:text-white cursor-pointer"
              title="Scanner une facture commerciale ou un Bill of Lading (BL)"
            >
              <Scan className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Scanner Facture</span>
            </button>

            {/* User Role Switcher */}
            <div className="relative hidden sm:block">
              <select
                id="user-role-select"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
              >
                <option value="Administrateur">👑 Administrateur</option>
                <option value="Agent Douanier">👮 Agent Douanier</option>
                <option value="Opérateur Déclarant">💼 Opérateur / Déclarant</option>
                <option value="Consultation">👁️ Consultation</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* New Simulation Primary Button */}
            <button
              id="nav-btn-new-simulation"
              onClick={() => setActiveTab('new-simulation')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs tracking-tight shadow-md hover:shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Nouvelle simulation</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
