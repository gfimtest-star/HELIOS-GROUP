import React, { useState } from 'react';
import { 
  Coins, 
  ArrowRightLeft, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Globe, 
  ShieldCheck,
  TrendingUp 
} from 'lucide-react';
import { ExchangeRateConfig } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from '../utils/customsCalculator';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface ExchangeRatesViewProps {
  rates: ExchangeRateConfig[];
  currentRate: ExchangeRateConfig;
  onUpdateRate: (rateData: Partial<ExchangeRateConfig>) => Promise<void>;
  userRole: string;
}

export const ExchangeRatesView: React.FC<ExchangeRatesViewProps> = ({
  rates,
  currentRate,
  onUpdateRate,
  userRole
}) => {
  // Converter state
  const [convertAmount, setConvertAmount] = useState<number>(1000);
  const [convertFrom, setConvertFrom] = useState<'USD' | 'CDF' | 'EUR'>('USD');
  const [convertTo, setConvertTo] = useState<'USD' | 'CDF' | 'EUR'>('CDF');

  // New rate form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newUSDCDF, setNewUSDCDF] = useState<number>(currentRate?.usd_to_cdf || 2850);
  const [newEURUSD, setNewEURUSD] = useState<number>(currentRate?.eur_to_usd || 1.085);
  const [newSource, setNewSource] = useState<string>('Banque Centrale du Congo (BCC) / DGDA');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Conversion calculations
  const rateUSDCDF = currentRate?.usd_to_cdf || 2850;
  const rateEURUSD = currentRate?.eur_to_usd || 1.085;
  const rateEURCDF = rateUSDCDF * rateEURUSD;

  const calculateConversion = () => {
    const amount = Number(convertAmount) || 0;
    if (convertFrom === convertTo) return amount;

    // Convert from -> USD
    let amountInUSD = amount;
    if (convertFrom === 'CDF') amountInUSD = amount / rateUSDCDF;
    if (convertFrom === 'EUR') amountInUSD = amount * rateEURUSD;

    // Convert USD -> to
    if (convertTo === 'USD') return amountInUSD;
    if (convertTo === 'CDF') return amountInUSD * rateUSDCDF;
    if (convertTo === 'EUR') return amountInUSD / rateEURUSD;

    return amountInUSD;
  };

  const convertedResult = calculateConversion();

  const handleSaveNewRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateRate({
        usd_to_cdf: Number(newUSDCDF),
        eur_to_usd: Number(newEURUSD),
        source: newSource
      });
      setShowAddForm(false);
    } catch (err: any) {
      alert("Erreur lors de la mise à jour du taux : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="exchange-rates-view" className="space-y-6">
      
      <LegalDisclaimerBanner compact />

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Marché des Changes & Douane RDC
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Référence : BCC & DGDA
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Taux de Change Officiels (USD / CDF / EUR)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Les valeurs de liquidation douanière en RDC sont converties au Franc Congolais (CDF) selon le cours indicatif de la DGDA.
          </p>
        </div>

        {userRole === 'Administrateur' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Mettre à jour le taux officiel</span>
          </button>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1 : USD / CDF */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 text-white border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono">USD / CDF</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              Actif Douane
            </span>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-white">
            1 USD = {rateUSDCDF.toLocaleString('fr-CD')} CDF
          </h3>
          <p className="text-[11px] text-slate-400">
            Cours officiel appliqué à toutes les simulations en cours
          </p>
        </div>

        {/* Card 2 : EUR / USD */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-mono">EUR / USD</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Cross-Rate
            </span>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-slate-900">
            1 EUR = {rateEURUSD} USD
          </h3>
          <p className="text-[11px] text-slate-500">
            Conversion des factures européennes vers USD
          </p>
        </div>

        {/* Card 3 : EUR / CDF */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-mono">EUR / CDF</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Calculé
            </span>
          </div>
          <h3 className="text-2xl font-extrabold font-mono text-slate-900">
            1 EUR = {Math.round(rateEURCDF).toLocaleString('fr-CD')} CDF
          </h3>
          <p className="text-[11px] text-slate-500">
            Équivalence Franc Congolais
          </p>
        </div>

      </div>

      {/* Admin Add New Rate Form */}
      {showAddForm && (
        <form onSubmit={handleSaveNewRate} className="bg-white rounded-2xl p-6 border-2 border-blue-400 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Saisir le nouveau taux officiel DGDA / BCC
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taux 1 USD = en CDF <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newUSDCDF}
                onChange={(e) => setNewUSDCDF(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taux 1 EUR = en USD
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={newEURUSD}
                onChange={(e) => setNewEURUSD(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Source officielle
              </label>
              <input
                type="text"
                required
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition"
            >
              {isSubmitting ? 'Application...' : 'Appliquer ce taux'}
            </button>
          </div>
        </form>
      )}

      {/* Interactive Currency Converter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          <span>Convertisseur de Devises Douanières Instantané</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
          
          {/* Amount input */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Montant à convertir</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={convertAmount}
                onChange={(e) => setConvertAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
              <select
                value={convertFrom}
                onChange={(e) => setConvertFrom(e.target.value as any)}
                className="w-28 bg-slate-100 border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
              >
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Swap icon */}
          <div className="flex justify-center sm:col-span-1 pt-4">
            <button
              onClick={() => {
                const prevFrom = convertFrom;
                setConvertFrom(convertTo);
                setConvertTo(prevFrom);
              }}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Inverser les devises"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Target output */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Résultat estimé</label>
            <div className="flex gap-2">
              <div className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-blue-900 flex items-center">
                {convertedResult.toLocaleString('fr-CD', { maximumFractionDigits: 2 })}
              </div>
              <select
                value={convertTo}
                onChange={(e) => setConvertTo(e.target.value as any)}
                className="w-28 bg-slate-100 border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
              >
                <option value="CDF">CDF (FC)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Rates History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Historique des Taux de Change Enregistrés</h3>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Date d'effet</th>
              <th className="py-3 px-4">USD / CDF</th>
              <th className="py-3 px-4">EUR / USD</th>
              <th className="py-3 px-4">Source officielle</th>
              <th className="py-3 px-4 text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono">{r.date}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.usd_to_cdf.toLocaleString('fr-CD')} CDF</td>
                <td className="py-3 px-4 font-mono">{r.eur_to_usd}</td>
                <td className="py-3 px-4 text-slate-600">{r.source}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.actif ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.actif ? 'Actif' : 'Archivé'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
