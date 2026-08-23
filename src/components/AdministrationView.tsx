import React, { useState } from 'react';
import { 
  Settings, 
  BookOpen, 
  Percent, 
  Award, 
  ShieldCheck, 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  History,
  FileSpreadsheet,
  AlertCircle 
} from 'lucide-react';
import { CodeTarifaireSH, TaxRuleConfig, Exoneration, AuditLog } from '../types/customs';

interface AdministrationViewProps {
  tarifSH: CodeTarifaireSH[];
  taxRules: TaxRuleConfig[];
  exonerations: Exoneration[];
  auditLogs: AuditLog[];
  onAddTarifItem: (item: Partial<CodeTarifaireSH>) => Promise<void>;
  onImportBulkTarif: (items: any[], version: string) => Promise<void>;
  onUpdateTaxRule: (ruleId: string, updated: Partial<TaxRuleConfig>) => Promise<void>;
  onAddExoneration: (exo: Partial<Exoneration>) => Promise<void>;
  userRole: string;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  tarifSH,
  taxRules,
  exonerations,
  auditLogs,
  onAddTarifItem,
  onImportBulkTarif,
  onUpdateTaxRule,
  onAddExoneration,
  userRole
}) => {
  const [adminTab, setAdminTab] = useState<'tarif' | 'rules' | 'exonerations' | 'audit'>('tarif');

  // New Code SH form state
  const [showAddCodeModal, setShowAddCodeModal] = useState<boolean>(false);
  const [newCodeSH, setNewCodeSH] = useState<string>('');
  const [newDesignation, setNewDesignation] = useState<string>('');
  const [newChapitre, setNewChapitre] = useState<string>('Chapitre 84');
  const [newDDI, setNewDDI] = useState<number>(10);
  const [newAccise, setNewAccise] = useState<number>(0);
  const [newTVA, setNewTVA] = useState<number>(16);
  const [newUnite, setNewUnite] = useState<string>('Unité');

  // Bulk CSV Import State
  const [csvText, setCsvText] = useState<string>('');
  const [importVersionName, setImportVersionName] = useState<string>('Mise à jour SH 2022 DGDA');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Exoneration form state
  const [showAddExoModal, setShowAddExoModal] = useState<boolean>(false);
  const [newExoTitre, setNewExoTitre] = useState<string>('');
  const [newExoBaseLegale, setNewExoBaseLegale] = useState<string>('');
  const [newExoDDI, setNewExoDDI] = useState<number>(100);
  const [newExoTVA, setNewExoTVA] = useState<number>(100);
  const [newExoAccises, setNewExoAccises] = useState<number>(100);

  const handleCreateCodeSH = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddTarifItem({
        code_sh: newCodeSH,
        designation: newDesignation,
        chapitre: newChapitre,
        section: 'Section générale',
        position: newCodeSH.substring(0, 4),
        sous_position: newCodeSH,
        taux_droit_douane: Number(newDDI),
        taux_accise: Number(newAccise),
        taux_tva: Number(newTVA),
        unite_taxation: newUnite,
        base_legale: 'Tarif officiel DGDA SH 2022',
        version_tarif: 'SH 2022 v1.0',
        actif: true
      });
      setShowAddCodeModal(false);
      setNewCodeSH('');
      setNewDesignation('');
      alert('Code SH ajouté avec succès.');
    } catch (err: any) {
      alert("Erreur lors de l'ajout : " + err.message);
    }
  };

  const handleBulkCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setImportSuccessMsg(null);

    try {
      // Parse CSV (Header: code_sh,designation,taux_ddi,taux_accise,taux_tva,unite,chapitre)
      const lines = csvText.trim().split('\n');
      const items: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('code_sh'))) continue;

        const parts = line.split(/[;,]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          items.push({
            code_sh: parts[0],
            designation: parts[1],
            taux_droit_douane: Number(parts[2]) || 10,
            taux_accise: Number(parts[3]) || 0,
            taux_tva: parts[4] !== undefined ? Number(parts[4]) : 16,
            unite_taxation: parts[5] || 'kg',
            chapitre: parts[6] || `Chapitre ${parts[0].substring(0, 2)}`
          });
        }
      }

      if (items.length === 0) {
        throw new Error('Aucune ligne valide trouvée dans le texte CSV.');
      }

      await onImportBulkTarif(items, importVersionName);
      setImportSuccessMsg(`${items.length} positions tarifaires importées avec succès.`);
      setCsvText('');
    } catch (err: any) {
      alert("Erreur lors de l'importation : " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateExoneration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddExoneration({
        code: `EXO-${Date.now().toString().substring(8)}`,
        titre: newExoTitre,
        base_legale: newExoBaseLegale,
        taux_exoneration_ddi: Number(newExoDDI),
        taux_exoneration_tva: Number(newExoTVA),
        taux_exoneration_accises: Number(newExoAccises),
        taux_exoneration_redevances: 0,
        document_justificatif: 'Arrêté Interministériel / Attestation d’exonération',
        actif: true
      });
      setShowAddExoModal(false);
      setNewExoTitre('');
      setNewExoBaseLegale('');
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  return (
    <div id="administration-view" className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Console d'Administration
            </span>
            <span className="text-xs text-blue-700 font-bold font-mono">
              Rôle Actif : {userRole}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Gestion du Tarif Douanier, Règles Fiscales & Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mise à jour des nomenclatures SH 2022, barèmes fiscaux officiels et historique des opérations
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'tarif', label: '1. Tarif SH 2022 & Import CSV', icon: BookOpen },
          { id: 'rules', label: '2. Règles Fiscales (DDI, TVA, RLF...)', icon: Percent },
          { id: 'exonerations', label: '3. Régimes & Exonérations', icon: Award },
          { id: 'audit', label: '4. Journal d’Audit & Sécurité', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1 : GESTION TARIF SH 2022 & IMPORT MASSE */}
      {/* ---------------------------------------------------- */}
      {adminTab === 'tarif' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1 : Add Individual SH Code */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ajouter un Code SH Officiel</h3>
                  <p className="text-xs text-slate-500">Ajout d’une sous-position tarifaire nationale à 8 chiffres</p>
                </div>
              </div>

              <form onSubmit={handleCreateCodeSH} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Code SH (8 chiffres)</label>
                    <input
                      type="text"
                      required
                      value={newCodeSH}
                      onChange={(e) => setNewCodeSH(e.target.value)}
                      placeholder="ex: 8528.72.00"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chapitre</label>
                    <input
                      type="text"
                      required
                      value={newChapitre}
                      onChange={(e) => setNewChapitre(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Désignation officielle</label>
                  <input
                    type="text"
                    required
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="ex: Récepteurs de télévision en couleurs..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Taux DDI (%)</label>
                    <select
                      value={newDDI}
                      onChange={(e) => setNewDDI(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    >
                      <option value={0}>0% (Exonéré/Intrants)</option>
                      <option value={5}>5% (Biens d'équipement)</option>
                      <option value={10}>10% (Matières premières)</option>
                      <option value={20}>20% (Biens de conso)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Accises (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={newAccise}
                      onChange={(e) => setNewAccise(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">TVA (%)</label>
                    <input
                      type="number"
                      value={newTVA}
                      onChange={(e) => setNewTVA(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Ajouter le Code SH
                  </button>
                </div>
              </form>
            </div>

            {/* Box 2 : Bulk CSV Import */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Import en Masse (CSV / Texte)</h3>
                  <p className="text-xs text-slate-500">Collez des lignes au format : code_sh;designation;ddi;accises;tva</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Libellé de la version importée</label>
                <input
                  type="text"
                  value={importVersionName}
                  onChange={(e) => setImportVersionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Données CSV brutes</label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="8517.13.00;Smartphones et téléphones cellulaires;20;5;16;Unité;Chapitre 85&#10;8471.30.00;Ordinateurs portables;5;0;16;Unité;Chapitre 84"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800"
                />
              </div>

              {importSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkCsvImport}
                  disabled={isImporting || !csvText.trim()}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Importation...' : 'Importer les codes'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Current Tariff summary count */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium text-slate-700">
            <span>Positions tarifaires actives dans la base locale : <strong className="text-blue-900 font-mono text-sm">{tarifSH.length} codes</strong></span>
            <span className="text-slate-500 font-mono">Source : DGDA Système Harmonisé 2022</span>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2 : RÈGLES FISCALES & REDEVANCES */}
      {/* ---------------------------------------------------- */}
      {adminTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Barèmes et Assiettes des Droits, Taxes & Redevances en RDC</h3>
            <p className="text-xs text-slate-500">Formules d’assiette fiscale DGDA et taux réglementaires légaux</p>
          </div>

          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Taxe / Droit</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Assiette de Calcul</th>
                <th className="py-3 px-4">Taux Légal</th>
                <th className="py-3 px-4">Base Légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">{rule.tax_name}</td>
                  <td className="py-3 px-4 font-mono text-blue-800 font-semibold">{rule.tax_code}</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50">{rule.tax_base_formula}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{rule.default_rate}%</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{rule.legal_reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3 : EXONÉRATIONS & RÉGIMES PRIVILÉGIÉS */}
      {/* ---------------------------------------------------- */}
      {adminTab === 'exonerations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catalogue des Régimes d'Exonération RDC</h3>
              <p className="text-xs text-slate-500">Code des investissements, conventions minières et accords bilatéraux</p>
            </div>
            <button
              onClick={() => setShowAddExoModal(!showAddExoModal)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              + Ajouter un régime d’exonération
            </button>
          </div>

          {showAddExoModal && (
            <form onSubmit={handleCreateExoneration} className="bg-purple-50 p-5 rounded-xl border border-purple-200 space-y-3">
              <h4 className="text-xs font-bold text-purple-950 uppercase">Nouveau Régime d'Exonération</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">Titre de l'exonération</label>
                  <input
                    type="text"
                    required
                    value={newExoTitre}
                    onChange={(e) => setNewExoTitre(e.target.value)}
                    placeholder="ex: Convention Minière Spécifique..."
                    className="w-full bg-white border border-purple-300 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">Base Légale / Décret</label>
                  <input
                    type="text"
                    required
                    value={newExoBaseLegale}
                    onChange={(e) => setNewExoBaseLegale(e.target.value)}
                    placeholder="ex: Arrêté Interministériel N° 045..."
                    className="w-full bg-white border border-purple-300 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExoModal(false)}
                  className="bg-white border border-purple-300 text-purple-900 text-xs px-3 py-1.5 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exonerations.map((exo) => (
              <div key={exo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                    {exo.code}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{exo.titre}</h4>
                <p className="text-[11px] text-slate-500">{exo.base_legale}</p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-700 flex justify-between font-mono">
                  <span>Exo DDI: <strong>{exo.taux_exoneration_ddi}%</strong></span>
                  <span>Exo TVA: <strong>{exo.taux_exoneration_tva}%</strong></span>
                  <span>Exo Accises: <strong>{exo.taux_exoneration_accises}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4 : JOURNAL D’AUDIT & SÉCURITÉ */}
      {/* ---------------------------------------------------- */}
      {adminTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Journal d'Audit des Opérations Douanières</h3>
              <p className="text-xs text-slate-500">Traçabilité complète des simulations, modifications tarifaires et taux de change</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
              {auditLogs.length} événements enregistrés
            </span>
          </div>

          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Horodatage</th>
                <th className="py-2.5 px-4">Utilisateur / Rôle</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entité / Réf</th>
                <th className="py-2.5 px-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.slice(0, 30).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-slate-500">{new Date(log.date).toLocaleString('fr-FR')}</td>
                  <td className="py-2.5 px-4 text-slate-900 font-sans font-medium">{log.utilisateur} ({log.role})</td>
                  <td className="py-2.5 px-4 font-bold text-blue-900">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-700">{log.entite}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans">{log.nouvelle_valeur || log.ancienne_valeur || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
