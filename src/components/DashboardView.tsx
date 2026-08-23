import React from 'react';
import { 
  DollarSign, 
  Container, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Scan, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  Anchor, 
  Eye,
  Car,
  Clock,
  Scale,
  GraduationCap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { SimulationDédouanement, ExchangeRateConfig } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from '../utils/customsCalculator';
import { genererPretaxePDF } from '../utils/pdfGenerator';
import { exporterSimulationExcel } from '../utils/excelExporter';

interface DashboardViewProps {
  simulations: SimulationDédouanement[];
  currentRate: ExchangeRateConfig;
  onNewSimulation: () => void;
  onViewSimulation: (sim: SimulationDédouanement) => void;
  onOpenScanner: () => void;
  onOpenAiAssistant: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  simulations,
  currentRate,
  onNewSimulation,
  onViewSimulation,
  onOpenScanner,
  onOpenAiAssistant,
  onNavigateToTab
}) => {
  // Compute KPIs
  const totalSimulations = simulations.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const simulationsAujourdhui = simulations.filter(s => s.date_creation.startsWith(todayStr)).length;

  const totalValeurCAFUSD = simulations.reduce((sum, s) => sum + (s.valeur_caf_globale_usd || 0), 0);
  const totalValeurCAFCDF = simulations.reduce((sum, s) => sum + (s.valeur_caf_globale_cdf || 0), 0);

  const totalDroitsDGDAUSD = simulations.reduce((sum, s) => sum + (s.total_droits_et_taxes_usd || 0), 0);
  const totalDroitsDGDACDF = simulations.reduce((sum, s) => sum + (s.total_droits_et_taxes_cdf || 0), 0);

  const totalFraisLogistiquesUSD = simulations.reduce((sum, s) => sum + (s.total_frais_logistiques_usd || 0), 0);
  const conteneursActifs = simulations.filter(s => s.statut === 'simulation' || s.statut === 'validee').length;

  // Chart Data 1: Breakdown of duties & taxes
  const totalDDI = simulations.reduce((sum, s) => sum + (s.total_ddi_usd || 0), 0);
  const totalTVA = simulations.reduce((sum, s) => sum + (s.total_tva_usd || 0), 0);
  const totalAccises = simulations.reduce((sum, s) => sum + (s.total_accises_usd || 0), 0);
  const totalRedevances = simulations.reduce((sum, s) => sum + (s.total_fpi_usd || 0) + (s.total_occ_usd || 0) + (s.total_rlf_usd || 0) + (s.total_autres_redevances_usd || 0), 0);

  const breakdownData = [
    { name: 'DDI (Douane)', value: totalDDI || 12000, color: '#2563eb' },
    { name: 'TVA (16%)', value: totalTVA || 14500, color: '#059669' },
    { name: 'Accises', value: totalAccises || 3200, color: '#d97706' },
    { name: 'Redevances (RLF/FPI/OCC)', value: totalRedevances || 4800, color: '#7c3aed' },
    { name: 'Frais Logistiques (Matadi)', value: totalFraisLogistiquesUSD || 3600, color: '#475569' }
  ];

  // Chart Data 2: Ports distribution
  const portsCount: Record<string, number> = { matadi: 0, boma: 0, kinshasa: 0, autre: 0 };
  simulations.forEach(s => {
    const p = s.port_entree || 'matadi';
    if (portsCount[p] !== undefined) portsCount[p]++;
    else portsCount.autre = (portsCount.autre || 0) + 1;
  });

  const portsData = [
    { name: 'Port de Matadi', conteneurs: portsCount.matadi || 1, color: '#0284c7' },
    { name: 'Port de Boma', conteneurs: portsCount.boma || 0, color: '#0d9488' },
    { name: 'Kinshasa (Beach/Entrepôts)', conteneurs: portsCount.kinshasa || 0, color: '#6366f1' },
    { name: 'Autres Postes', conteneurs: portsCount.autre || 0, color: '#64748b' }
  ];

  // Chart Data 3: Recent simulations financial comparison
  const recentSimsChart = simulations.slice(0, 5).map((s, idx) => ({
    name: s.conteneur_numero || `Sim #${idx + 1}`,
    valeurCAF: s.valeur_caf_globale_usd || 0,
    droitsDGDA: s.total_droits_et_taxes_usd || 0,
    fraisLogistiques: s.total_frais_logistiques_usd || 0
  })).reverse();

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* Welcome Banner with Quick Shortcuts */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                Système Harmonisé SH 2022
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Port de Matadi • République Démocratique du Congo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tableau de Bord & Estimation Douanière
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Effectuez un pré-calcul transparent et détaillé de la prétaxe, des droits de douane (DDI), accises, TVA (16%), redevances (RLF, FPI, OCC) et frais portuaires SCTP/MGT au Port de Matadi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dash-btn-scan"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Scan className="w-4 h-4 text-blue-400" />
              <span>Scanner BL / Facture</span>
            </button>

            <button
              id="dash-btn-ai"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Assistant SH</span>
            </button>

            <button
              id="dash-btn-new"
              onClick={onNewSimulation}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md hover:shadow-amber-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nouvelle simulation</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Total Simulations */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulations Totales</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalSimulations}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{simulationsAujourdhui} créée(s) aujourd’hui</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 : Total Valeur CAF */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur CAF Simulée</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
              {formatCurrencyUSD(totalValeurCAFUSD)}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1 truncate max-w-[180px]">
              ≈ {formatCurrencyCDF(totalValeurCAFCDF)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 : Total Droits & Taxes DGDA */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Droits & Taxes DGDA</p>
            <h3 className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
              {formatCurrencyUSD(totalDroitsDGDAUSD)}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1 truncate max-w-[180px]">
              ≈ {formatCurrencyCDF(totalDroitsDGDACDF)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 : Conteneurs en Cours & Port */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conteneurs Actifs</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{conteneursActifs}</h3>
            <p className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
              <Anchor className="w-3 h-3" />
              <span>Matadi • Boma • Kinshasa</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Container className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Specialized Tools Quick Access Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <h3 className="text-sm font-bold text-white tracking-tight">Outils Spécialisés & Simulateurs Sectoriels RDC</h3>
          </div>
          <span className="text-[11px] text-slate-400">DGDA • MGT • GUICE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Vehicules Argus */}
          <div 
            onClick={() => onNavigateToTab('vehicle-calc')}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-800/50">
                Argus DGDA
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">Véhicules & Engins</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Décote d'âge, droits d'accises selon cm³, barème officiel et fret Ro-Ro Boma/Matadi.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-blue-400 flex items-center gap-1">
              <span>Simuler un véhicule</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Surestaries & Magasinage */}
          <div 
            onClick={() => onNavigateToTab('demurrage-calc')}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-800/50">
                MGT / SCTP
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Surestaries & Séjour Port</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Franchises CMA-CGM, Maersk, MSC, magasinage terre-plein et caution conteneur.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-amber-400 flex items-center gap-1">
              <span>Calculer les surestaries</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Comparateur Regimes */}
          <div 
            onClick={() => onNavigateToTab('regimes-compare')}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-semibold border border-indigo-800/50">
                IM4 / IM5 / IM7
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Comparateur de Régimes</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Arbitrage trésorerie entre consommation, admission temporaire et entrepôt.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
              <span>Comparer les régimes</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Guide Procedures */}
          <div 
            onClick={() => onNavigateToTab('procedures-guide')}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-800/50">
                Checklist
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Guide des Procédures RDC</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                6 étapes clés du dédouanement, documents obligatoires et conseils de dédouanement.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>Consulter le guide</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1 : Tax & Duty Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Structure Fiscale & Frais</h3>
              <p className="text-xs text-slate-500">Répartition DDI, TVA, Accises & Redevances</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
              DGDA RDC
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${formatCurrencyUSD(Number(val))}`, 'Montant']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {breakdownData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate text-[11px]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2 : Recent Simulation Values (Bar Chart) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Comparatif Financier des Simulations Récentes</h3>
              <p className="text-xs text-slate-500">Valeur CAF vs Total Droits DGDA vs Frais Portuaires</p>
            </div>
            <button
              onClick={() => onNavigateToTab('simulations')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentSimsChart.length > 0 ? recentSimsChart : [{ name: 'Exemple', valeurCAF: 40000, droitsDGDA: 18000, fraisLogistiques: 1200 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`${formatCurrencyUSD(Number(val))}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="valeurCAF" name="Valeur CAF" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="droitsDGDA" name="Droits DGDA" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraisLogistiques" name="Frais Logistiques" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#0284c7]"></span>
              <span>Valeur CAF ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#10b981]"></span>
              <span>Droits & Taxes DGDA ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#f59e0b]"></span>
              <span>Frais Logistiques ($)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Simulations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dernières Simulations de Dédouanement</h3>
            <p className="text-xs text-slate-500">Estimations préalables générées pour le Port de Matadi & frontières RDC</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('simulations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/60"
            >
              Historique complet ({simulations.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Réf / Date</th>
                <th className="py-3 px-4">Importateur</th>
                <th className="py-3 px-4">Conteneur & BL</th>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4 text-right">Valeur CAF</th>
                <th className="py-3 px-4 text-right">Droits & Taxes DGDA</th>
                <th className="py-3 px-4 text-right">Coût Global Est.</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulations.slice(0, 5).map((sim) => (
                <tr key={sim.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Ref & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono">{sim.reference}</div>
                    <div className="text-[11px] text-slate-400">{new Date(sim.date_creation).toLocaleDateString('fr-FR')}</div>
                  </td>

                  {/* Importer */}
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    <div className="truncate max-w-[160px]" title={sim.importateur_nom}>{sim.importateur_nom || 'Non renseigné'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">NIF: {sim.importateur_nif || 'N/A'}</div>
                  </td>

                  {/* Container & BL */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-800">{sim.conteneur_numero || 'Sans conteneur'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">BL: {sim.numero_bl || 'N/A'}</div>
                  </td>

                  {/* Port */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium uppercase font-mono">
                      <Anchor className="w-3 h-3 text-blue-500" />
                      {sim.port_entree}
                    </span>
                  </td>

                  {/* Customs Value */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrencyUSD(sim.valeur_caf_globale_usd)}
                  </td>

                  {/* Customs Duties */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatCurrencyUSD(sim.total_droits_et_taxes_usd)}
                  </td>

                  {/* Global Cost */}
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-900">
                    {formatCurrencyUSD(sim.cout_global_estime_usd)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      sim.statut === 'validee'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : sim.statut === 'simulation'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sim.statut}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewSimulation(sim)}
                        title="Consulter le détail & la prétaxe"
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => genererPretaxePDF(sim)}
                        title="Générer la prétaxe PDF"
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exporterSimulationExcel(sim)}
                        title="Exporter vers Excel"
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
