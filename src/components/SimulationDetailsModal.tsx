import React from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Container, 
  Ship, 
  Building, 
  Scale, 
  ShieldCheck, 
  FileText,
  Calendar,
  Anchor,
  DollarSign,
  Info 
} from 'lucide-react';
import { SimulationDédouanement } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from '../utils/customsCalculator';
import { genererPretaxePDF } from '../utils/pdfGenerator';
import { exporterSimulationExcel } from '../utils/excelExporter';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface SimulationDetailsModalProps {
  simulation: SimulationDédouanement | null;
  onClose: () => void;
}

export const SimulationDetailsModal: React.FC<SimulationDetailsModalProps> = ({
  simulation,
  onClose
}) => {
  if (!simulation) return null;

  return (
    <div id="simulation-details-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-amber-400 flex items-center justify-center border border-blue-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Prétaxe Douanière N° {simulation.reference}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  {simulation.statut}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Port d’entrée : {simulation.port_entree.toUpperCase()} • Taux : 1 USD = {simulation.taux_change_usd_cdf} CDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => genererPretaxePDF(simulation)}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exporterSimulationExcel(simulation)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <LegalDisclaimerBanner compact />

          {/* Importer & Container Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Commercial info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Importateur & Facture Commerciale</span>
              </h4>
              <div className="flex justify-between"><span className="text-slate-500">Importateur :</span><span className="font-bold text-slate-900">{simulation.importateur_nom || 'Non spécifié'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">RCCM :</span><span className="font-mono text-slate-700">{simulation.importateur_rccm || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">NIF :</span><span className="font-mono text-slate-700">{simulation.importateur_nif || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fournisseur :</span><span className="text-slate-800">{simulation.fournisseur_nom || 'N/A'} ({simulation.fournisseur_pays || 'N/A'})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Facture N° :</span><span className="font-mono text-slate-800">{simulation.numero_facture || 'N/A'} (du {simulation.date_facture || 'N/A'})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Incoterm :</span><span className="font-bold text-blue-800">{simulation.incoterm}</span></div>
            </div>

            {/* Container & Transport */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Container className="w-3.5 h-3.5 text-indigo-600" />
                <span>Conteneur & Transport Maritime</span>
              </h4>
              <div className="flex justify-between"><span className="text-slate-500">N° Conteneur :</span><span className="font-mono font-bold text-blue-900">{simulation.conteneur_numero || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type de Conteneur :</span><span className="text-slate-800 font-semibold">{simulation.conteneur_type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">BL (Connaissement) :</span><span className="font-mono text-slate-800">{simulation.numero_bl || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Navire :</span><span className="text-slate-800">{simulation.nom_navire || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Poids Brut / Colis :</span><span className="font-mono text-slate-800">{simulation.poids_brut_kg || 0} kg / {simulation.nombre_colis || 1} colis</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Régime Douanier :</span><span className="font-bold text-purple-900 uppercase font-mono">{simulation.regime_douanier}</span></div>
            </div>

          </div>

          {/* Customs Value Box */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 rounded-xl text-white border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Valeur en Douane (CAF / CIF)</span>
                <p className="text-slate-300 text-xs mt-0.5">
                  FOB: {formatCurrencyUSD(simulation.valeur_marchandise_fob_usd)} + Fret: {formatCurrencyUSD(simulation.fret_usd)} + Assurance: {formatCurrencyUSD(simulation.assurance_usd)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {formatCurrencyUSD(simulation.valeur_caf_globale_usd)}
                </span>
                <p className="text-[11px] text-slate-300 font-mono">
                  {formatCurrencyCDF(simulation.valeur_caf_globale_cdf)}
                </p>
              </div>
            </div>
          </div>

          {/* Goods Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              Détail des Lignes de Marchandises ({simulation.marchandises.length})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-slate-700">
                <thead className="bg-slate-100 font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Désignation</th>
                    <th className="py-2.5 px-3">Code SH</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Valeur CAF</th>
                    <th className="py-2.5 px-3 text-center">DDI</th>
                    <th className="py-2.5 px-3 text-center">TVA</th>
                    <th className="py-2.5 px-3 text-right">Total Droits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                  {simulation.marchandises.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{m.designation}</td>
                      <td className="py-2 px-3 font-bold text-blue-900">{m.code_sh}</td>
                      <td className="py-2 px-3 text-center">{m.quantite} {m.unite}</td>
                      <td className="py-2 px-3 text-right">{formatCurrencyUSD(m.valeur_caf_usd)}</td>
                      <td className="py-2 px-3 text-center">{m.taux_ddi}%</td>
                      <td className="py-2 px-3 text-center">{m.taux_tva}%</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrencyUSD(m.total_droits_taxes_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Taxes & Redevances DGDA */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              Décompte des Droits & Redevances DGDA
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-slate-700">
                <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Taxe / Redevance</th>
                    <th className="py-2 px-3 text-right">Montant (USD)</th>
                    <th className="py-2 px-3 text-right">Montant (CDF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-900">Droit de Douane à l’Importation (DDI)</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(simulation.total_ddi_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_ddi_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  {simulation.total_accises_usd > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Droits d’Accises (DA)</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(simulation.total_accises_usd)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_accises_usd * simulation.taux_change_usd_cdf)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-900">Taxe sur la Valeur Ajoutée (TVA 16%)</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(simulation.total_tva_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_tva_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Redevance Logistique Ferroviaire (RLF 1.5%)</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrencyUSD(simulation.total_rlf_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_rlf_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Fonds de Promotion de l’Industrie (FPI 2.0%)</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrencyUSD(simulation.total_fpi_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_fpi_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Office Congolais de Contrôle (OCC 1.5%)</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrencyUSD(simulation.total_occ_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_occ_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Frais Informatiques & Timbre Sydonia</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrencyUSD(simulation.total_autres_redevances_usd)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(simulation.total_autres_redevances_usd * simulation.taux_change_usd_cdf)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-extrabold text-slate-900">
                    <td className="py-2.5 px-3 uppercase">TOTAL DROITS ET TAXES DGDA</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">{formatCurrencyUSD(simulation.total_droits_et_taxes_usd)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatCurrencyCDF(simulation.total_droits_et_taxes_cdf)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Totals */}
          <div className="bg-slate-950 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase">Estimation Globale Dédouanement + Port</span>
              <h3 className="text-base font-extrabold text-white">COÛT GLOBAL ESTIMATIF</h3>
              <p className="text-[11px] text-slate-400">Incluant {formatCurrencyUSD(simulation.total_frais_logistiques_usd)} de frais portuaires Matadi</p>
            </div>
            <div className="text-left sm:text-right font-mono">
              <div className="text-2xl font-extrabold text-amber-400">{formatCurrencyUSD(simulation.cout_global_estime_usd)}</div>
              <div className="text-xs text-slate-300">{formatCurrencyCDF(simulation.cout_global_estime_cdf)}</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400 italic">
            Source tarifaire : DGDA RDC SH 2022 • Document indicatif
          </span>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
