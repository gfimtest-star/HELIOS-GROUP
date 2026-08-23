import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  Filter, 
  Sparkles, 
  Plus, 
  Check, 
  Copy, 
  Info, 
  ShieldCheck, 
  ExternalLink,
  SlidersHorizontal 
} from 'lucide-react';
import { CodeTarifaireSH } from '../types/customs';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface TarifCatalogViewProps {
  tarifSH: CodeTarifaireSH[];
  onOpenAiAssistant: (onSelectCode?: (code: CodeTarifaireSH) => void) => void;
  onUseCodeInSimulation: (code: CodeTarifaireSH) => void;
}

export const TarifCatalogView: React.FC<TarifCatalogViewProps> = ({
  tarifSH,
  onOpenAiAssistant,
  onUseCodeInSimulation
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChapitre, setSelectedChapitre] = useState<string>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Extract unique chapters for filter
  const uniqueChapters = Array.from(new Set(tarifSH.map(t => t.chapitre))).filter(Boolean);

  const filteredTarif = tarifSH.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      item.code_sh.toLowerCase().includes(q) ||
      item.designation.toLowerCase().includes(q) ||
      item.chapitre.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q);

    const matchChapitre = selectedChapitre === 'all' || item.chapitre === selectedChapitre;

    return matchQuery && matchChapitre;
  });

  const handleCopyCode = (code: CodeTarifaireSH) => {
    navigator.clipboard.writeText(code.code_sh);
    setCopiedCodeId(code.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div id="tarif-catalog-view" className="space-y-6">
      
      <LegalDisclaimerBanner compact />

      {/* Header & Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Nomenclature Officielle DGDA
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Version Système Harmonisé SH 2022
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Tarif Douanier & Droits de Douane RDC (SH 2022)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez la base officielle des positions tarifaires à 8 chiffres, taux de DDI (0 à 20%), TVA (16%) et droits d'accises.
            </p>
          </div>

          <button
            onClick={() => onOpenAiAssistant(onUseCodeInSimulation)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Assistant IA de Classification</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code SH (ex: 8415.10.00), désignation (ex: climatiseur, riz, véhicules)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedChapitre}
              onChange={(e) => setSelectedChapitre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
            >
              <option value="all">Tous les chapitres tarifaires ({uniqueChapters.length})</option>
              {uniqueChapters.map((chap, idx) => (
                <option key={idx} value={chap}>
                  {chap}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Grid of Tariff Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTarif.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            
            {/* Top Code & Copy */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-extrabold text-blue-900 text-sm bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {item.code_sh}
                </span>

                <button
                  onClick={() => handleCopyCode(item)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Copier le code SH"
                >
                  {copiedCodeId === item.id ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copié
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-3 leading-snug line-clamp-2" title={item.designation}>
                {item.designation}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                {item.chapitre} • {item.section}
              </p>
            </div>

            {/* Rates Table / Pills */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">DDI</span>
                  <p className="font-extrabold text-blue-900 font-mono text-sm mt-0.5">
                    {item.taux_droit_douane}%
                  </p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">TVA</span>
                  <p className="font-extrabold text-emerald-800 font-mono text-sm mt-0.5">
                    {item.taux_tva}%
                  </p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Accises</span>
                  <p className={`font-extrabold font-mono text-sm mt-0.5 ${item.taux_accise > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {item.taux_accise}%
                  </p>
                </div>

              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Unité : <strong className="text-slate-800">{item.unite_taxation}</strong></span>
                <span className="font-mono text-[10px] text-slate-400">{item.version_tarif}</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => onUseCodeInSimulation(item)}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Utiliser dans une simulation</span>
            </button>

          </div>
        ))}
      </div>

    </div>
  );
};
