import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  Copy, 
  Trash2, 
  Plus, 
  Anchor, 
  Calendar, 
  Container,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { SimulationDédouanement } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from '../utils/customsCalculator';
import { genererPretaxePDF } from '../utils/pdfGenerator';
import { exporterSimulationExcel } from '../utils/excelExporter';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface SimulationsListViewProps {
  simulations: SimulationDédouanement[];
  onNewSimulation: () => void;
  onViewSimulation: (sim: SimulationDédouanement) => void;
  onDuplicateSimulation: (sim: SimulationDédouanement) => void;
  onDeleteSimulation: (id: string) => void;
}

export const SimulationsListView: React.FC<SimulationsListViewProps> = ({
  simulations,
  onNewSimulation,
  onViewSimulation,
  onDuplicateSimulation,
  onDeleteSimulation
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredSimulations = simulations.filter(sim => {
    // Search query matching
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      sim.reference?.toLowerCase().includes(q) ||
      sim.importateur_nom?.toLowerCase().includes(q) ||
      sim.conteneur_numero?.toLowerCase().includes(q) ||
      sim.numero_bl?.toLowerCase().includes(q) ||
      sim.fournisseur_nom?.toLowerCase().includes(q) ||
      sim.marchandises?.some(m => m.designation?.toLowerCase().includes(q) || m.code_sh?.includes(q));

    // Port filter
    const matchPort = selectedPort === 'all' || sim.port_entree === selectedPort;

    // Status filter
    const matchStatus = selectedStatus === 'all' || sim.statut === selectedStatus;

    return matchQuery && matchPort && matchStatus;
  });

  return (
    <div id="simulations-list-view" className="space-y-6">
      
      <LegalDisclaimerBanner compact />

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Historique des Simulations & Prétaxes Douanières
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez, téléchargez en PDF ou exportez en Excel vos dossiers d'estimation de dédouanement
            </p>
          </div>

          <button
            onClick={onNewSimulation}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle simulation</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Search text */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par n° conteneur, importateur, BL, code SH, référence..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Port Filter */}
          <div>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
            >
              <option value="all">Tous les ports d'entrée</option>
              <option value="matadi">Port de Matadi</option>
              <option value="boma">Port de Boma</option>
              <option value="kinshasa">Kinshasa (Port/Beach)</option>
              <option value="kasumbalesa">Kasumbalesa</option>
              <option value="goma">Goma</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="validee">Validée</option>
              <option value="simulation">Simulation</option>
              <option value="rejetee">Rejetée</option>
              <option value="archivee">Archivée</option>
            </select>
          </div>

        </div>

      </div>

      {/* Table of Simulations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {filteredSimulations.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Aucune simulation trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Aucun dossier ne correspond à vos critères de recherche. Modifiez vos filtres ou lancez un nouveau calcul.
            </p>
            <button
              onClick={onNewSimulation}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une simulation</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Réf / Date</th>
                  <th className="py-3.5 px-4">Importateur</th>
                  <th className="py-3.5 px-4">Conteneur & BL</th>
                  <th className="py-3.5 px-4">Port</th>
                  <th className="py-3.5 px-4 text-right">Valeur CAF</th>
                  <th className="py-3.5 px-4 text-right">Droits & Taxes DGDA</th>
                  <th className="py-3.5 px-4 text-right">Frais Portuaires</th>
                  <th className="py-3.5 px-4 text-right">Coût Estimatif Global</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSimulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Reference & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{sim.reference}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(sim.date_creation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>

                    {/* Importer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[150px]" title={sim.importateur_nom}>
                        {sim.importateur_nom || 'Non spécifié'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        NIF: {sim.importateur_nif || 'N/A'}
                      </div>
                    </td>

                    {/* Container & BL */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-950 flex items-center gap-1">
                        <Container className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sim.conteneur_numero || 'Sans numéro'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        BL: {sim.numero_bl || 'N/A'}
                      </div>
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

                    {/* Logistic Fees */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrencyUSD(sim.total_frais_logistiques_usd)}
                    </td>

                    {/* Global Estimated Cost */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-extrabold text-blue-900 text-xs">
                        {formatCurrencyUSD(sim.cout_global_estime_usd)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatCurrencyCDF(sim.cout_global_estime_cdf)}
                      </div>
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
                          title="Télécharger la prétaxe PDF"
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
                        <button
                          onClick={() => onDuplicateSimulation(sim)}
                          title="Dupliquer cette simulation"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Voulez-vous supprimer définitivement la simulation ${sim.reference} ?`)) {
                              onDeleteSimulation(sim.id);
                            }
                          }}
                          title="Supprimer la simulation"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
