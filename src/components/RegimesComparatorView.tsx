import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  HelpCircle, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  Building, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { ExchangeRateConfig } from '../types/customs';

interface RegimesComparatorViewProps {
  currentRate: ExchangeRateConfig;
}

export const RegimesComparatorView: React.FC<RegimesComparatorViewProps> = ({ currentRate }) => {
  // Base parameters for comparison
  const [valeurFOB_USD, setValeurFOB_USD] = useState<number>(50000);
  const [fret_USD, setFret_USD] = useState<number>(6500);
  const [assurance_USD, setAssurance_USD] = useState<number>(450);
  const [tauxDDI, setTauxDDI] = useState<number>(10);
  const [tauxAccises, setTauxAccises] = useState<number>(0);
  const [dureeMoisProjet, setDureeMoisProjet] = useState<number>(12); // For temporary admission

  // Computed CIF / CAF
  const valeurCAF_USD = valeurFOB_USD + fret_USD + assurance_USD;
  const valeurCAF_CDF = valeurCAF_USD * currentRate.usd_to_cdf;

  // 1. Regime IM4: Mise a la consommation definitive
  const im4_ddi = valeurCAF_USD * (tauxDDI / 100);
  const im4_accises = (valeurCAF_USD + im4_ddi) * (tauxAccises / 100);
  const im4_tva = (valeurCAF_USD + im4_ddi + im4_accises) * 0.16;
  const im4_rlf = valeurCAF_USD * 0.015;
  const im4_fpi = valeurCAF_USD * 0.02;
  const im4_occ = valeurCAF_USD * 0.015;
  const im4_sydonia = 85;
  const im4_totalTaxes_USD = im4_ddi + im4_accises + im4_tva + im4_rlf + im4_fpi + im4_occ + im4_sydonia;

  // 2. Regime IM5: Admission Temporaire (AT - Equipements, chantiers, mines)
  // En RDC, suspension des droits et taxes sous couvert d'un acquit-à-caution / cautionnement bancaire (100% des droits suspendus)
  // Redevance d'usage mensuelle (environ 2.5% des droits suspendus par mois ou taxe de régularisation)
  const im5_cautionBancaire_USD = im4_totalTaxes_USD;
  const im5_redevanceUsageMensuelle_USD = (im4_totalTaxes_USD * 0.025) * dureeMoisProjet;
  const im5_fraisDossierDGDA_USD = 250;
  const im5_decaissementImmediat_USD = im5_redevanceUsageMensuelle_USD + im5_fraisDossierDGDA_USD;

  // 3. Regime IM7: Entrepot de Douane (Stockage sous douane / Bonded Warehouse)
  // Suspension totale jusqu'à sortie d'entrepôt (délai max 2 ans)
  // Caution globale de transit / entrepôt
  const im7_cautionSuspensive_USD = im4_totalTaxes_USD;
  const im7_fraisGardiennageMensuel_USD = 150 * dureeMoisProjet;
  const im7_decaissementImmediat_USD = im7_fraisGardiennageMensuel_USD + 120; // Frais d'acquit

  // 4. Regime IM8: Transit Douanier International (T1 / Matadi vers Kinshasa ou RDC vers Pays Voisins)
  // Déclaration T1 sous escorte douanière / balise GPS
  const im8_cautionTransit_USD = im4_totalTaxes_USD;
  const im8_fraisBaliseGPS_USD = 180;
  const im8_fraisEscorteDGDA_USD = 120;
  const im8_decaissementImmediat_USD = im8_fraisBaliseGPS_USD + im8_fraisEscorteDGDA_USD;

  return (
    <div id="regimes-comparator-view" className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Comparateur des Régimes Douaniers RDC
                </h1>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  IM4 • IM5 • IM7 • IM8
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Arbitrage financier et trésorerie entre la mise à la consommation, l'admission temporaire (matériel de chantier / mines), l'entrepôt sous douane et le transit T1.
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

      {/* Input Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Paramètres de la Marchandise / Expédition pour Comparaison</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valeur FOB ($)</label>
            <input
              type="number"
              value={valeurFOB_USD}
              onChange={(e) => setValeurFOB_USD(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fret Maritime ($)</label>
            <input
              type="number"
              value={fret_USD}
              onChange={(e) => setFret_USD(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Taux DDI (%)</label>
            <select
              value={tauxDDI}
              onChange={(e) => setTauxDDI(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value={0}>0% (Exonéré)</option>
              <option value={5}>5% (Biens d'équipement)</option>
              <option value={10}>10% (Matières premières)</option>
              <option value={20}>20% (Produits finis / Conso)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Droits d'Accises (%)</label>
            <input
              type="number"
              value={tauxAccises}
              onChange={(e) => setTauxAccises(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Durée Projet (Mois)</label>
            <input
              type="number"
              value={dureeMoisProjet}
              onChange={(e) => setDureeMoisProjet(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>Assiette CAF calculée : <strong className="text-white font-mono">{valeurCAF_USD.toLocaleString('fr-FR')} $</strong> (≈ {valeurCAF_CDF.toLocaleString('fr-FR')} CDF)</span>
          <span>Assurance estimée : <strong>{assurance_USD} $</strong></span>
        </div>
      </div>

      {/* Comparison Grid (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. IM4 Mise a la consommation */}
        <div className="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                Modèle IM4
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Libre Pratique
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Mise à la Consommation Définitive</h3>
              <p className="text-xs text-slate-400 mt-1">
                Liquidation intégrale et immédiate de tous les droits & taxes DGDA au port d'entrée.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1 text-xs">
              <div className="text-slate-400">Décaissement Fiscal Immédiat :</div>
              <div className="text-xl font-extrabold text-blue-400 font-mono">
                {im4_totalTaxes_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </div>
              <div className="text-[10px] text-slate-400">
                ≈ {(im4_totalTaxes_USD * currentRate.usd_to_cdf).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>DDI + Accises :</span>
                <span className="font-mono text-white">{(im4_ddi + im4_accises).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>TVA (16.0%) :</span>
                <span className="font-mono text-white">{im4_tva.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>RLF + FPI + OCC :</span>
                <span className="font-mono text-white">{(im4_rlf + im4_fpi + im4_occ).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Caution exigée :</span>
                <span className="font-mono text-emerald-400 font-semibold">0 $ (Aucune)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400">
            ✅ <strong>Idéal pour :</strong> Vente locale, matières consommées définitivement, fin des obligations douanières.
          </div>
        </div>

        {/* 2. IM5 Admission Temporaire */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                Modèle IM5
              </span>
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Suspensif
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Admission Temporaire (AT)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pour matériel de forage, engins miniers ou machines de chantier réexportés à terme.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1 text-xs">
              <div className="text-slate-400">Décaissement Direct Immédiat :</div>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                {im5_decaissementImmediat_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </div>
              <div className="text-[10px] text-slate-400">
                Économie cash : {(im4_totalTaxes_USD - im5_decaissementImmediat_USD).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Caution Bancaire (100%) :</span>
                <span className="font-mono text-amber-300 font-semibold">{im5_cautionBancaire_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Redevance usage ({dureeMoisProjet} mois) :</span>
                <span className="font-mono text-white">{im5_redevanceUsageMensuelle_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Délai légal max :</span>
                <span className="font-mono text-white">12 à 24 mois</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400">
            ⚠️ <strong>Exigence :</strong> Mainlevée de caution obligatoire lors de la réexportation sous contrôle DGDA.
          </div>
        </div>

        {/* 3. IM7 Entrepot Sous Douane */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                Modèle IM7
              </span>
              <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                <Building className="w-3 h-3" /> Stockage
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Entrepôt de Douane (Public / Privé)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Stockage en franchise temporaire avec paiement des taxes au fur et à mesure des ventes.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1 text-xs">
              <div className="text-slate-400">Décaissement Douane Initial :</div>
              <div className="text-xl font-extrabold text-purple-400 font-mono">
                {im7_decaissementImmediat_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </div>
              <div className="text-[10px] text-slate-400">
                Fractionnement des droits selon les sorties
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Caution Globale Entrepôt :</span>
                <span className="font-mono text-purple-300 font-semibold">{im7_cautionSuspensive_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Frais gardiennage estimés :</span>
                <span className="font-mono text-white">{im7_fraisGardiennageMensuel_USD.toLocaleString('fr-FR')} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Délai maximal stockage :</span>
                <span className="font-mono text-white">Jusqu'à 24 mois</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400">
            📦 <strong>Idéal pour :</strong> Négociants, importateurs de grands stocks (carburants, denrées, véhicules).
          </div>
        </div>

        {/* 4. IM8 Transit International */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                Modèle IM8 / T1
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Transit
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Transit Douanier (National / T1)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Acheminement sous douane de Matadi vers Kinshasa, Lubumbashi ou pays limitrophes.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1 text-xs">
              <div className="text-slate-400">Frais de Passage / Balise :</div>
              <div className="text-xl font-extrabold text-cyan-400 font-mono">
                {im8_decaissementImmediat_USD.toLocaleString('fr-FR')} $
              </div>
              <div className="text-[10px] text-slate-400">
                Paiement final au bureau de destination
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Caution de Transit Routier :</span>
                <span className="font-mono text-cyan-300 font-semibold">{im8_cautionTransit_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Balise GPS & Suivi DGDA :</span>
                <span className="font-mono text-white">{im8_fraisBaliseGPS_USD} $</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Délai de route réglementaire :</span>
                <span className="font-mono text-white">3 à 5 jours ouvrés</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400">
            🚚 <strong>Exigence :</strong> Scellés douaniers intacts et déclaration d'apurement au bureau d'arrivée.
          </div>
        </div>

      </div>

    </div>
  );
};
