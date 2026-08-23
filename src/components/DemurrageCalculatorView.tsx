import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Coins, 
  Ship, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { ExchangeRateConfig } from '../types/customs';

interface DemurrageCalculatorViewProps {
  currentRate: ExchangeRateConfig;
}

type ShippingLine = 'cma_cgm' | 'maersk' | 'msc' | 'hapag_lloyd' | 'grimaldi' | 'pil' | 'autre';
type TerminalOperator = 'mgt_matadi' | 'sctp_onatra' | 'port_boma' | 'kinshasa_beach';

interface DemurrageTier {
  dayStart: number;
  dayEnd: number; // 999 for infinity
  rate20DryUSD: number;
  rate40DryUSD: number;
  rateReeferUSD: number;
}

interface ShippingLineProfile {
  name: string;
  defaultFreeDays: number;
  tiers: DemurrageTier[];
  caution20USD: number;
  caution40USD: number;
}

const SHIPPING_PROFILES: Record<ShippingLine, ShippingLineProfile> = {
  cma_cgm: {
    name: 'CMA CGM RDC',
    defaultFreeDays: 14,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 25, rate40DryUSD: 50, rateReeferUSD: 90 },
      { dayStart: 8, dayEnd: 15, rate20DryUSD: 45, rate40DryUSD: 85, rateReeferUSD: 140 },
      { dayStart: 16, dayEnd: 999, rate20DryUSD: 75, rate40DryUSD: 140, rateReeferUSD: 210 },
    ],
    caution20USD: 1000,
    caution40USD: 2000
  },
  maersk: {
    name: 'Maersk Line / Safmarine RDC',
    defaultFreeDays: 14,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 28, rate40DryUSD: 55, rateReeferUSD: 95 },
      { dayStart: 8, dayEnd: 14, rate20DryUSD: 50, rate40DryUSD: 90, rateReeferUSD: 150 },
      { dayStart: 15, dayEnd: 999, rate20DryUSD: 80, rate40DryUSD: 150, rateReeferUSD: 220 },
    ],
    caution20USD: 1200,
    caution40USD: 2200
  },
  msc: {
    name: 'MSC (Mediterranean Shipping Co)',
    defaultFreeDays: 12,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 25, rate40DryUSD: 50, rateReeferUSD: 85 },
      { dayStart: 8, dayEnd: 14, rate20DryUSD: 45, rate40DryUSD: 80, rateReeferUSD: 135 },
      { dayStart: 15, dayEnd: 999, rate20DryUSD: 70, rate40DryUSD: 130, rateReeferUSD: 195 },
    ],
    caution20USD: 1000,
    caution40USD: 2000
  },
  grimaldi: {
    name: 'Grimaldi Lines / ACL',
    defaultFreeDays: 10,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 22, rate40DryUSD: 44, rateReeferUSD: 75 },
      { dayStart: 8, dayEnd: 15, rate20DryUSD: 40, rate40DryUSD: 75, rateReeferUSD: 120 },
      { dayStart: 16, dayEnd: 999, rate20DryUSD: 65, rate40DryUSD: 120, rateReeferUSD: 180 },
    ],
    caution20USD: 800,
    caution40USD: 1600
  },
  hapag_lloyd: {
    name: 'Hapag-Lloyd RDC',
    defaultFreeDays: 14,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 25, rate40DryUSD: 50, rateReeferUSD: 90 },
      { dayStart: 8, dayEnd: 15, rate20DryUSD: 48, rate40DryUSD: 88, rateReeferUSD: 145 },
      { dayStart: 16, dayEnd: 999, rate20DryUSD: 75, rate40DryUSD: 140, rateReeferUSD: 210 },
    ],
    caution20USD: 1000,
    caution40USD: 2000
  },
  pil: {
    name: 'PIL (Pacific International Lines)',
    defaultFreeDays: 12,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 24, rate40DryUSD: 48, rateReeferUSD: 85 },
      { dayStart: 8, dayEnd: 14, rate20DryUSD: 42, rate40DryUSD: 78, rateReeferUSD: 130 },
      { dayStart: 15, dayEnd: 999, rate20DryUSD: 68, rate40DryUSD: 125, rateReeferUSD: 185 },
    ],
    caution20USD: 900,
    caution40USD: 1800
  },
  autre: {
    name: 'Autre Armateur / Standard',
    defaultFreeDays: 10,
    tiers: [
      { dayStart: 1, dayEnd: 7, rate20DryUSD: 25, rate40DryUSD: 50, rateReeferUSD: 90 },
      { dayStart: 8, dayEnd: 15, rate20DryUSD: 45, rate40DryUSD: 85, rateReeferUSD: 140 },
      { dayStart: 16, dayEnd: 999, rate20DryUSD: 75, rate40DryUSD: 140, rateReeferUSD: 200 },
    ],
    caution20USD: 1000,
    caution40USD: 2000
  }
};

export const DemurrageCalculatorView: React.FC<DemurrageCalculatorViewProps> = ({ currentRate }) => {
  // Input parameters
  const [shippingLine, setShippingLine] = useState<ShippingLine>('cma_cgm');
  const [terminalOperator, setTerminalOperator] = useState<TerminalOperator>('mgt_matadi');
  
  // Date configuration
  const [dateDebarquement, setDateDebarquement] = useState<string>('2026-08-01');
  const [dateRestitution, setDateRestitution] = useState<string>('2026-08-25');
  
  // Free days override
  const profile = SHIPPING_PROFILES[shippingLine];
  const [franchiseJours, setFranchiseJours] = useState<number>(profile.defaultFreeDays);
  const [franchiseTerrePlein, setFranchiseTerrePlein] = useState<number>(7); // Standard 7 jours de franchise terminal portuaire

  // Container counts
  const [count20Dry, setCount20Dry] = useState<number>(2);
  const [count40Dry, setCount40Dry] = useState<number>(1);
  const [countReefer, setCountReefer] = useState<number>(0);

  // Compute number of elapsed days
  const elapsedDays = useMemo(() => {
    try {
      const d1 = new Date(dateDebarquement);
      const d2 = new Date(dateRestitution);
      const diffTime = d2.getTime() - d1.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch {
      return 0;
    }
  }, [dateDebarquement, dateRestitution]);

  // Jours de surestaries (Armateur)
  const joursSurestaries = Math.max(0, elapsedDays - franchiseJours);
  // Jours de magasinage / séjour terre-plein (Terminal)
  const joursMagasinage = Math.max(0, elapsedDays - franchiseTerrePlein);

  // Demurrage calculation per container type
  const demurrageCalculation = useMemo(() => {
    let cost20 = 0;
    let cost40 = 0;
    let costReefer = 0;

    if (joursSurestaries > 0) {
      for (let day = 1; day <= joursSurestaries; day++) {
        // Find tier
        const tier = profile.tiers.find(t => day >= t.dayStart && day <= t.dayEnd) || profile.tiers[profile.tiers.length - 1];
        cost20 += tier.rate20DryUSD * count20Dry;
        cost40 += tier.rate40DryUSD * count40Dry;
        costReefer += tier.rateReeferUSD * countReefer;
      }
    }

    const totalArmateurUSD = cost20 + cost40 + costReefer;
    return { cost20, cost40, costReefer, totalArmateurUSD };
  }, [joursSurestaries, profile.tiers, count20Dry, count40Dry, countReefer]);

  // Terminal Storage calculation (Matadi Gateway Terminal MGT / SCTP)
  // Bareme standard de magasinage conteneurs pleins a Matadi :
  // Franchise: 7 jours
  // Jours 1 a 7 de depassement: $10 / 20', $20 / 40'
  // Jours 8 a 15 de depassement: $20 / 20', $40 / 40'
  // Jours 16+ de depassement: $35 / 20', $70 / 40'
  const storageCalculation = useMemo(() => {
    let cost20 = 0;
    let cost40 = 0;
    let costReefer = 0;

    if (joursMagasinage > 0) {
      for (let day = 1; day <= joursMagasinage; day++) {
        let rate20 = 10;
        let rate40 = 20;
        let rateRef = 35;

        if (day > 15) {
          rate20 = 35;
          rate40 = 70;
          rateRef = 90;
        } else if (day > 7) {
          rate20 = 20;
          rate40 = 40;
          rateRef = 60;
        }

        cost20 += rate20 * count20Dry;
        cost40 += rate40 * count40Dry;
        costReefer += rateRef * countReefer;
      }
    }

    const totalTerminalUSD = cost20 + cost40 + costReefer;
    return { cost20, cost40, costReefer, totalTerminalUSD };
  }, [joursMagasinage, count20Dry, count40Dry, countReefer]);

  // Caution conteneur totale
  const cautionTotaleUSD = (count20Dry * profile.caution20USD) + (count40Dry * profile.caution40USD) + (countReefer * (profile.caution40USD * 1.5));
  
  // Total pénalités combinées
  const totalPenalitesUSD = demurrageCalculation.totalArmateurUSD + storageCalculation.totalTerminalUSD;
  const totalPenalitesCDF = totalPenalitesUSD * currentRate.usd_to_cdf;

  const handleShippingLineChange = (line: ShippingLine) => {
    setShippingLine(line);
    setFranchiseJours(SHIPPING_PROFILES[line].defaultFreeDays);
  };

  return (
    <div id="demurrage-calculator-view" className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Calculateur de Surestaries & Magasinage Portuaire
                </h1>
                <span className="text-xs bg-rose-500/20 text-rose-300 font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Port de Matadi / Boma
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Estimation des pénalités de surestaries maritimes (armateurs) et de séjour terre-plein (MGT / SCTP ex-ONATRA) selon les barèmes officiels RDC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <Coins className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <div className="text-slate-400">Taux DGDA Hebdo :</div>
              <div className="font-bold text-emerald-300">1 USD = {currentRate.usd_to_cdf.toLocaleString('fr-FR')} CDF</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Inputs vs Real-time calculation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Parameters Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Ship className="w-4 h-4 text-blue-400" />
              <span>1. Armateur, Terminal & Dates de Séjour</span>
            </h2>

            {/* Armateur Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ligne Maritime (Armateur émetteur du Connaissement BL)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(SHIPPING_PROFILES) as ShippingLine[]).map((lineKey) => {
                  const p = SHIPPING_PROFILES[lineKey];
                  const isSelected = shippingLine === lineKey;
                  return (
                    <button
                      key={lineKey}
                      type="button"
                      onClick={() => handleShippingLineChange(lineKey)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-amber-500/20 border-amber-500 text-white font-medium' 
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold">{p.name.split('(')[0]}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Franchise: {p.defaultFreeDays} jours</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terminal Operator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Opérateur du Terminal Portuaire / Quai de Débarquement
              </label>
              <select
                value={terminalOperator}
                onChange={(e) => setTerminalOperator(e.target.value as TerminalOperator)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="mgt_matadi">MGT (Matadi Gateway Terminal / ICTSI) - Port de Matadi</option>
                <option value="sctp_onatra">SCTP (ex-ONATRA) - Quai Public Matadi</option>
                <option value="port_boma">Port de Boma (SCTP / Terminal Boma)</option>
                <option value="kinshasa_beach">Beach Ngobila / Port Fluvial Kinshasa</option>
              </select>
            </div>

            {/* Dates & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date de Débarquement Quai (Discharge)
                </label>
                <input
                  type="date"
                  value={dateDebarquement}
                  onChange={(e) => setDateDebarquement(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date Prévisionnelle de Restitution Vide (Gate-in)
                </label>
                <input
                  type="date"
                  value={dateRestitution}
                  onChange={(e) => setDateRestitution(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Free Days (Franchises) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Franchise Armateur Surestaries (Jours libres)
                </label>
                <input
                  type="number"
                  value={franchiseJours}
                  onChange={(e) => setFranchiseJours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Selon mention figurant sur le connaissement (BL)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Franchise Magasinage Terminal (Jours gratuits)
                </label>
                <input
                  type="number"
                  value={franchiseTerrePlein}
                  onChange={(e) => setFranchiseTerrePlein(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard terminal RDC : 7 jours</span>
              </div>
            </div>

            {/* Container counts */}
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-t border-slate-800 pt-4 pb-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. Parc & Typologie des Conteneurs</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <label className="block text-xs font-bold text-slate-200 mb-1">Conteneurs 20' Dry</label>
                <input
                  type="number"
                  value={count20Dry}
                  onChange={(e) => setCount20Dry(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-2">Caution: {profile.caution20USD} $/unité</div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <label className="block text-xs font-bold text-slate-200 mb-1">Conteneurs 40' Dry / HC</label>
                <input
                  type="number"
                  value={count40Dry}
                  onChange={(e) => setCount40Dry(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-2">Caution: {profile.caution40USD} $/unité</div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <label className="block text-xs font-bold text-slate-200 mb-1">Conteneurs Frigorifiques (Reefer)</label>
                <input
                  type="number"
                  value={countReefer}
                  onChange={(e) => setCountReefer(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-2">Caution: {profile.caution40USD * 1.5} $/unité</div>
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Results & Penalties (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Bilan des Frais & Surestaries</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                joursSurestaries > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {elapsedDays} jours de rotation
              </span>
            </div>

            {/* Key timeline summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Durée totale écoulée au port :</span>
                <span className="font-bold text-white">{elapsedDays} jours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Dépassement Surestaries Armateur :</span>
                <span className={`font-bold font-mono ${joursSurestaries > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {joursSurestaries} jours taxables
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Dépassement Magasinage Terminal :</span>
                <span className={`font-bold font-mono ${joursMagasinage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {joursMagasinage} jours taxables
                </span>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-3">
              
              {/* Armateur */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-blue-400" />
                    Surestaries Armateur ({profile.name}) :
                  </span>
                  <span className="font-bold text-amber-300 font-mono">
                    {demurrageCalculation.totalArmateurUSD.toLocaleString('fr-FR')} $
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pl-5 mt-0.5">
                  20': {demurrageCalculation.cost20} $ • 40': {demurrageCalculation.cost40} $ • Reefer: {demurrageCalculation.costReefer} $
                </div>
              </div>

              {/* Terminal */}
              <div className="border-t border-slate-700/80 pt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Magasinage Terre-Plein (MGT / SCTP) :
                  </span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {storageCalculation.totalTerminalUSD.toLocaleString('fr-FR')} $
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pl-5 mt-0.5">
                  20': {storageCalculation.cost20} $ • 40': {storageCalculation.cost40} $ • Reefer: {storageCalculation.costReefer} $
                </div>
              </div>

              {/* Caution Container */}
              <div className="border-t border-slate-700/80 pt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Caution Conteneurs à déposer (Remboursable) :</span>
                  <span className="font-semibold text-slate-200 font-mono">{cautionTotaleUSD.toLocaleString('fr-FR')} $</span>
                </div>
              </div>

            </div>

            {/* Total Penalties Card */}
            <div className={`rounded-xl p-4 border text-center ${
              totalPenalitesUSD > 0 
                ? 'bg-rose-950/30 border-rose-800/60' 
                : 'bg-emerald-950/30 border-emerald-800/60'
            }`}>
              <div className="text-xs font-semibold text-slate-300">TOTAL DES PÉNALITÉS DE SÉJOUR</div>
              <div className={`text-2xl font-extrabold mt-1 ${totalPenalitesUSD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalPenalitesUSD.toLocaleString('fr-FR')} $
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                ≈ {totalPenalitesCDF.toLocaleString('fr-FR')} CDF
              </div>
            </div>

            {/* Advice & Optimization Tips */}
            <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Conseils Pratiques Déclarant :
              </div>
              <ul className="list-disc pl-4 text-slate-400 space-y-1 text-[11px]">
                <li>Négociez dès l'émission du BL maritime <strong>21 jours de franchise</strong> pour Matadi afin d'anticiper les délais de visite douanière.</li>
                <li>Procédez au pré-dédouanement anticipé dès réception de l'Avis d'Arrivée navire dans Sydonia World.</li>
                <li>Effectuez le dépotage direct sur quai si la marchandise est destinée à Kinshasa pour éviter la caution conteneur.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
