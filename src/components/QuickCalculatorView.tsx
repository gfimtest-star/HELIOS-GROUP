import React, { useState } from 'react';
import { 
  Calculator, 
  RefreshCw, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  Layers
} from 'lucide-react';
import { CodeTarifaireSH, ExchangeRateConfig } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from '../utils/customsCalculator';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface QuickCalculatorViewProps {
  tarifSH: CodeTarifaireSH[];
  currentRate: ExchangeRateConfig;
  onNavigateToNewSimulation: () => void;
}

export const QuickCalculatorView: React.FC<QuickCalculatorViewProps> = ({
  tarifSH,
  currentRate,
  onNavigateToNewSimulation
}) => {
  const [selectedSHCode, setSelectedSHCode] = useState<string>('8415.10.00');
  const [valeurFOB, setValeurFOB] = useState<number>(10000);
  const [fret, setFret] = useState<number>(1500);
  const [assurance, setAssurance] = useState<number>(150);
  const [tauxAcciseCustom, setTauxAcciseCustom] = useState<number>(0);
  const [regime, setRegime] = useState<string>('mise_a_la_consommation');

  const matchedSH = tarifSH.find(t => t.code_sh === selectedSHCode) || tarifSH[0];

  // Calculations
  const rateUSDCDF = currentRate?.usd_to_cdf || 2850;
  const valeurCAF = Number(valeurFOB) + Number(fret) + Number(assurance);
  const valeurCAF_CDF = valeurCAF * rateUSDCDF;

  const ddiRate = matchedSH?.taux_droit_douane || 10;
  const acciseRate = matchedSH?.taux_accise || tauxAcciseCustom || 0;
  const tvaRate = matchedSH?.taux_tva !== undefined ? matchedSH.taux_tva : 16;

  const montantDDI = (valeurCAF * ddiRate) / 100;
  const baseAccise = valeurCAF + montantDDI;
  const montantAccise = (baseAccise * acciseRate) / 100;
  const baseTVA = valeurCAF + montantDDI + montantAccise;
  const montantTVA = (baseTVA * tvaRate) / 100;

  const montantRLF = (valeurCAF * 1.5) / 100;
  const montantFPI = (valeurCAF * 2.0) / 100;
  const montantOCC = (valeurCAF * 1.5) / 100;
  const montantDGRAD = 50;

  const totalDroitsDGDA_USD = montantDDI + montantAccise + montantTVA + montantRLF + montantFPI + montantOCC + montantDGRAD;
  const totalDroitsDGDA_CDF = totalDroitsDGDA_USD * rateUSDCDF;

  return (
    <div id="quick-calculator-view" className="space-y-6">
      
      <LegalDisclaimerBanner compact />

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Outil Express
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Port de Matadi • SH 2022
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Calculateur Rapide de Droits de Douane
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimez instantanément les droits de douane et taxes pour un article ou un lot unique
          </p>
        </div>

        <button
          onClick={onNavigateToNewSimulation}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <span>Créer un dossier complet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Paramètres du calcul
          </h3>

          {/* Select SH Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Position Tarifaire SH 2022
            </label>
            <select
              value={selectedSHCode}
              onChange={(e) => setSelectedSHCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
            >
              {tarifSH.map((code) => (
                <option key={code.id} value={code.code_sh}>
                  {code.code_sh} - {code.designation.substring(0, 45)}... (DDI: {code.taux_droit_douane}%)
                </option>
              ))}
            </select>
          </div>

          {/* Selected details */}
          {matchedSH && (
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
              <p className="font-bold">{matchedSH.designation}</p>
              <p className="text-[11px] text-blue-800">
                {matchedSH.chapitre} • {matchedSH.section}
              </p>
              <div className="flex gap-3 text-xs font-mono font-bold pt-1">
                <span>DDI: {matchedSH.taux_droit_douane}%</span>
                <span>TVA: {matchedSH.taux_tva}%</span>
                <span>Accises: {matchedSH.taux_accise}%</span>
              </div>
            </div>
          )}

          {/* Values Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valeur Marchandise FOB ($ USD)
            </label>
            <input
              type="number"
              min="0"
              value={valeurFOB}
              onChange={(e) => setValeurFOB(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fret Maritime ($)
              </label>
              <input
                type="number"
                min="0"
                value={fret}
                onChange={(e) => setFret(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assurance ($)
              </label>
              <input
                type="number"
                min="0"
                value={assurance}
                onChange={(e) => setAssurance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Taux de change appliqué :</span>
            <span className="font-mono font-bold text-slate-900">1 USD = {rateUSDCDF} CDF</span>
          </div>

        </div>

        {/* Result Breakdown Column */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Total Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
            <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Estimation Fiscale Immédiate
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-400">Total Droits & Taxes DGDA à Payer :</p>
                <h3 className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
                  {formatCurrencyUSD(totalDroitsDGDA_USD)}
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  ≈ {formatCurrencyCDF(totalDroitsDGDA_CDF)}
                </p>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <p className="text-xs text-slate-400">Valeur Douane (CAF) :</p>
                <p className="text-lg font-bold text-white font-mono mt-0.5">
                  {formatCurrencyUSD(valeurCAF)}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatCurrencyCDF(valeurCAF_CDF)}
                </p>
              </div>
            </div>
          </div>

          {/* Taxes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Taxe</th>
                  <th className="py-2.5 px-3">Assiette Taxable</th>
                  <th className="py-2.5 px-3">Taux</th>
                  <th className="py-2.5 px-3 text-right">Montant ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">DDI (Droit de Douane)</td>
                  <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(valeurCAF)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{ddiRate}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(montantDDI)}</td>
                </tr>

                {montantAccise > 0 && (
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Droits d’Accises</td>
                    <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(baseAccise)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{acciseRate}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(montantAccise)}</td>
                  </tr>
                )}

                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">TVA (16%)</td>
                  <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(baseTVA)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">16%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(montantTVA)}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 text-slate-800">Redevance RLF (OGEFREM)</td>
                  <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(valeurCAF)}</td>
                  <td className="py-2.5 px-3 font-mono">1.5%</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrencyUSD(montantRLF)}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 text-slate-800">Fonds FPI</td>
                  <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(valeurCAF)}</td>
                  <td className="py-2.5 px-3 font-mono">2.0%</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrencyUSD(montantFPI)}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 text-slate-800">Contrôle OCC</td>
                  <td className="py-2.5 px-3 font-mono">{formatCurrencyUSD(valeurCAF)}</td>
                  <td className="py-2.5 px-3 font-mono">1.5%</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrencyUSD(montantOCC)}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 text-slate-800">Timbre & Informatique DGDA</td>
                  <td className="py-2.5 px-3 font-mono">Forfait</td>
                  <td className="py-2.5 px-3 font-mono">Forfait</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrencyUSD(montantDGRAD)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
