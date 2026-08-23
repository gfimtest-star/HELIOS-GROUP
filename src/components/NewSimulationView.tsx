import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Scan, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  RefreshCw, 
  Info,
  DollarSign,
  Container,
  Ship,
  Building,
  Scale,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  SimulationDédouanement, 
  MarchandiseLigne, 
  CodeTarifaireSH, 
  ContainerType, 
  PortEntree, 
  IncotermType, 
  RegimeDouanier, 
  FraisLogistiqueItem, 
  ExchangeRateConfig, 
  Exoneration 
} from '../types/customs';
import { DEFAULT_LOGISTIC_FEES_MATADI, DEFAULT_PORTS, DEFAULT_EXONERATIONS } from '../data/defaultSettings';
import { calculerDedouanement, formatCurrencyUSD, formatCurrencyCDF, CalculationResult } from '../utils/customsCalculator';
import { genererPretaxePDF } from '../utils/pdfGenerator';
import { exporterSimulationExcel } from '../utils/excelExporter';
import { LegalDisclaimerBanner } from './LegalDisclaimerBanner';

interface NewSimulationViewProps {
  tarifSH: CodeTarifaireSH[];
  currentRate: ExchangeRateConfig;
  onSaveSimulation: (sim: SimulationDédouanement) => Promise<SimulationDédouanement>;
  onOpenAiAssistant: (onSelectCode?: (code: CodeTarifaireSH) => void) => void;
  onOpenScanner: (onDataExtracted?: (data: any) => void) => void;
  initialData?: Partial<SimulationDédouanement> | null;
}

export const NewSimulationView: React.FC<NewSimulationViewProps> = ({
  tarifSH,
  currentRate,
  onSaveSimulation,
  onOpenAiAssistant,
  onOpenScanner,
  initialData
}) => {
  // Wizard active step (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);
  const [savedSimulationResult, setSavedSimulationResult] = useState<SimulationDédouanement | null>(null);

  // Form State
  // 1. Conteneur & Transport
  const [conteneurNumero, setConteneurNumero] = useState<string>(initialData?.conteneur_numero || '');
  const [conteneurType, setConteneurType] = useState<ContainerType>(initialData?.conteneur_type || '40_pieds_hc');
  const [nombreColis, setNombreColis] = useState<number>(initialData?.nombre_colis || 1);
  const [poidsBrutKg, setPoidsBrutKg] = useState<number>(initialData?.poids_brut_kg || 24000);
  const [poidsNetKg, setPoidsNetKg] = useState<number>(initialData?.poids_net_kg || 22500);
  const [portEntree, setPortEntree] = useState<PortEntree>(initialData?.port_entree || 'matadi');
  const [nomNavire, setNomNavire] = useState<string>(initialData?.nom_navire || 'CMA CGM MATADI');
  const [paysOrigine, setPaysOrigine] = useState<string>(initialData?.pays_origine || 'Chine');
  const [paysProvenance, setPaysProvenance] = useState<string>(initialData?.pays_provenance || 'Chine');
  const [paysExpedition, setPaysExpedition] = useState<string>(initialData?.pays_expedition || 'Chine');
  const [dateArriveePrevue, setDateArriveePrevue] = useState<string>(initialData?.date_arrivee_prevue || new Date().toISOString().split('T')[0]);
  const [numeroBL, setNumeroBL] = useState<string>(initialData?.numero_bl || '');
  const [numeroFacture, setNumeroFacture] = useState<string>(initialData?.numero_facture || '');
  const [deviseFacturation, setDeviseFacturation] = useState<string>(initialData?.devise_facturation || 'USD');

  // 2. Commercial & Importateur
  const [importateurNom, setImportateurNom] = useState<string>(initialData?.importateur_nom || '');
  const [importateurAdresse, setImportateurAdresse] = useState<string>(initialData?.importateur_adresse || '');
  const [importateurRCCM, setImportateurRCCM] = useState<string>(initialData?.importateur_rccm || '');
  const [importateurIDNat, setImportateurIDNat] = useState<string>(initialData?.importateur_id_nat || '');
  const [importateurNIF, setImportateurNIF] = useState<string>(initialData?.importateur_nif || '');
  const [importateurTelephone, setImportateurTelephone] = useState<string>(initialData?.importateur_telephone || '');
  const [importateurEmail, setImportateurEmail] = useState<string>(initialData?.importateur_email || '');
  const [fournisseurNom, setFournisseurNom] = useState<string>(initialData?.fournisseur_nom || '');
  const [fournisseurPays, setFournisseurPays] = useState<string>(initialData?.fournisseur_pays || 'Chine');
  const [dateFacture, setDateFacture] = useState<string>(initialData?.date_facture || new Date().toISOString().split('T')[0]);
  const [incoterm, setIncoterm] = useState<IncotermType>(initialData?.incoterm || 'CIF');

  // 3. Valeurs Globales
  const [fretUSD, setFretUSD] = useState<number>(initialData?.fret_usd || 4500);
  const [assuranceUSD, setAssuranceUSD] = useState<number>(initialData?.assurance_usd || 550);
  const [autresFraisUSD, setAutresFraisUSD] = useState<number>(initialData?.autres_elements_evaluation_usd || 0);

  // 4. Marchandises
  const [marchandises, setMarchandises] = useState<Partial<MarchandiseLigne>[]>(
    initialData?.marchandises && initialData.marchandises.length > 0
      ? initialData.marchandises
      : [
          {
            id: 'm-1',
            designation: 'Climatiseurs split 12000 BTU Inverter R32',
            code_sh: '8415.10.00',
            quantite: 120,
            unite: 'Set',
            prix_unitaire_usd: 165,
            valeur_fob_usd: 19800,
            poids_kg: 14000,
            pays_origine: 'Chine',
            taux_ddi: 20,
            taux_accise: 0,
            taux_tva: 16
          }
        ]
  );

  // 5. Régimes & Exonérations
  const [regimeDouanier, setRegimeDouanier] = useState<RegimeDouanier>(initialData?.regime_douanier || 'mise_a_la_consommation');
  const [selectedExonerationId, setSelectedExonerationId] = useState<string>(initialData?.exoneration_id || '');
  const [accordCommercial, setAccordCommercial] = useState<string>(initialData?.accord_commercial || '');
  const [preuveOrigine, setPreuveOrigine] = useState<string>(initialData?.preuve_origine || '');

  // 6. Frais Logistiques Portuaires
  const [fraisLogistiques, setFraisLogistiques] = useState<FraisLogistiqueItem[]>(
    initialData?.frais_logistiques && initialData.frais_logistiques.length > 0
      ? initialData.frais_logistiques
      : DEFAULT_LOGISTIC_FEES_MATADI
  );

  const [observations, setObservations] = useState<string>(initialData?.observations || '');

  // Search Modal for HS Code on active row
  const [activeMarchandiseIndexForSearch, setActiveMarchandiseIndexForSearch] = useState<number | null>(null);
  const [shSearchQuery, setShSearchQuery] = useState<string>('');

  // Auto-calculate on state change
  const selectedExo = DEFAULT_EXONERATIONS.find(e => e.id === selectedExonerationId) || null;

  const calculationResult: CalculationResult = calculerDedouanement({
    marchandises,
    fret_global_usd: Number(fretUSD) || 0,
    assurance_globale_usd: Number(assuranceUSD) || 0,
    autres_frais_evaluation_usd: Number(autresFraisUSD) || 0,
    taux_change_usd_cdf: currentRate?.usd_to_cdf || 2850,
    regime_douanier: regimeDouanier,
    exoneration: selectedExo,
    frais_logistiques: fraisLogistiques
  });

  // Handle OCR auto-fill
  const handleOcrDataReceived = (data: any) => {
    if (data.importateur_nom) setImportateurNom(data.importateur_nom);
    if (data.importateur_rccm) setImportateurRCCM(data.importateur_rccm);
    if (data.importateur_nif) setImportateurNIF(data.importateur_nif);
    if (data.fournisseur_nom) setFournisseurNom(data.fournisseur_nom);
    if (data.fournisseur_pays) setFournisseurPays(data.fournisseur_pays);
    if (data.numero_facture) setNumeroFacture(data.numero_facture);
    if (data.date_facture) setDateFacture(data.date_facture);
    if (data.numero_bl) setNumeroBL(data.numero_bl);
    if (data.conteneur_numero) setConteneurNumero(data.conteneur_numero);
    if (data.fret_usd) setFretUSD(Number(data.fret_usd));
    if (data.assurance_usd) setAssuranceUSD(Number(data.assurance_usd));
    if (data.poids_brut_kg) setPoidsBrutKg(Number(data.poids_brut_kg));
    if (data.nombre_colis) setNombreColis(Number(data.nombre_colis));

    if (data.marchandises && Array.isArray(data.marchandises) && data.marchandises.length > 0) {
      const parsedItems = data.marchandises.map((m: any, idx: number) => {
        // Try match SH code
        let matchedSH = tarifSH.find(t => t.code_sh === m.code_sh_suggere);
        if (!matchedSH && m.designation) {
          const lower = m.designation.toLowerCase();
          matchedSH = tarifSH.find(t => lower.includes(t.designation.toLowerCase()) || t.designation.toLowerCase().includes(lower));
        }

        return {
          id: `m-ocr-${idx + 1}`,
          designation: m.designation || `Marchandise #${idx + 1}`,
          code_sh: matchedSH?.code_sh || m.code_sh_suggere || '0000.00.00',
          quantite: Number(m.quantite) || 1,
          unite: m.unite || 'Unité',
          prix_unitaire_usd: Number(m.prix_unitaire_usd) || 100,
          valeur_fob_usd: (Number(m.quantite) || 1) * (Number(m.prix_unitaire_usd) || 100),
          poids_kg: Number(m.poids_kg) || 0,
          pays_origine: data.pays_origine || 'Chine',
          taux_ddi: matchedSH?.taux_droit_douane || 10,
          taux_accise: matchedSH?.taux_accise || 0,
          taux_tva: matchedSH?.taux_tva !== undefined ? matchedSH.taux_tva : 16
        };
      });
      setMarchandises(parsedItems);
    }
  };

  // Add / Remove merchandise rows
  const handleAddMarchandise = () => {
    const newItem: Partial<MarchandiseLigne> = {
      id: `m-${Date.now()}`,
      designation: '',
      code_sh: '1006.30.00', // Default example
      quantite: 1,
      unite: 'Unité',
      prix_unitaire_usd: 0,
      valeur_fob_usd: 0,
      poids_kg: 0,
      pays_origine: paysOrigine || 'Chine',
      taux_ddi: 10,
      taux_accise: 0,
      taux_tva: 16
    };
    setMarchandises([...marchandises, newItem]);
  };

  const handleRemoveMarchandise = (index: number) => {
    if (marchandises.length <= 1) return;
    const updated = [...marchandises];
    updated.splice(index, 1);
    setMarchandises(updated);
  };

  const handleUpdateMarchandise = (index: number, field: string, value: any) => {
    const updated = [...marchandises];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantite' || field === 'prix_unitaire_usd') {
      const q = field === 'quantite' ? Number(value) : Number(item.quantite || 0);
      const pu = field === 'prix_unitaire_usd' ? Number(value) : Number(item.prix_unitaire_usd || 0);
      item.valeur_fob_usd = q * pu;
    }

    if (field === 'code_sh') {
      const matched = tarifSH.find(t => t.code_sh === value);
      if (matched) {
        item.taux_ddi = matched.taux_droit_douane;
        item.taux_accise = matched.taux_accise;
        item.taux_tva = matched.taux_tva;
        if (!item.designation) item.designation = matched.designation;
      }
    }

    updated[index] = item;
    setMarchandises(updated);
  };

  const handleSelectSHCode = (index: number, code: CodeTarifaireSH) => {
    const updated = [...marchandises];
    updated[index] = {
      ...updated[index],
      code_sh: code.code_sh,
      designation: updated[index].designation || code.designation,
      taux_ddi: code.taux_droit_douane,
      taux_accise: code.taux_accise,
      taux_tva: code.taux_tva
    };
    setMarchandises(updated);
    setActiveMarchandiseIndexForSearch(null);
  };

  // Toggle Logistic fee
  const handleToggleFrais = (id: string) => {
    setFraisLogistiques(fraisLogistiques.map(f => f.id === id ? { ...f, actif: !f.actif } : f));
  };

  const handleUpdateFraisAmount = (id: string, montant_usd: number) => {
    setFraisLogistiques(fraisLogistiques.map(f => f.id === id ? { ...f, montant_usd, montant_cdf: montant_usd * (currentRate?.usd_to_cdf || 2850) } : f));
  };

  // Validation before next step or final saving
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!importateurNom.trim()) errors.push("Le nom de l'importateur est requis.");
    if (!conteneurNumero.trim()) errors.push("Le numéro du conteneur est requis (ex: MSKU7829104).");
    if (!numeroBL.trim()) errors.push("Le numéro de Bill of Lading (BL) est requis.");
    if (marchandises.length === 0) errors.push("Au moins une ligne de marchandise est requise.");

    marchandises.forEach((m, idx) => {
      if (!m.designation?.trim()) errors.push(`Marchandise #${idx + 1} : désignation obligatoire.`);
      if (!m.code_sh || m.code_sh === '0000.00.00') errors.push(`Marchandise #${idx + 1} : code SH 8 chiffres valide obligatoire.`);
      if ((m.quantite || 0) <= 0) errors.push(`Marchandise #${idx + 1} : quantité supérieure à 0 requise.`);
      if ((m.prix_unitaire_usd || 0) <= 0) errors.push(`Marchandise #${idx + 1} : prix unitaire supérieur à 0 requis.`);
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Save Simulation to Server
  const handleFinalSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const fullSimulation: SimulationDédouanement = {
        id: `sim-${Date.now()}`,
        reference: `SIM-${new Date().getFullYear()}-${portEntree.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
        statut: 'validee',
        
        conteneur_numero: conteneurNumero,
        conteneur_type: conteneurType,
        nombre_colis: Number(nombreColis),
        poids_brut_kg: Number(poidsBrutKg),
        poids_net_kg: Number(poidsNetKg),
        port_entree: portEntree,
        nom_navire: nomNavire,
        pays_origine: paysOrigine,
        pays_provenance: paysProvenance,
        pays_expedition: paysExpedition,
        date_arrivee_prevue: dateArriveePrevue,
        numero_bl: numeroBL,
        numero_facture: numeroFacture,
        devise_facturation: deviseFacturation,

        importateur_nom: importateurNom,
        importateur_adresse: importateurAdresse,
        importateur_rccm: importateurRCCM,
        importateur_id_nat: importateurIDNat,
        importateur_nif: importateurNIF,
        importateur_telephone: importateurTelephone,
        importateur_email: importateurEmail,
        fournisseur_nom: fournisseurNom,
        fournisseur_pays: fournisseurPays,
        date_facture: dateFacture,
        incoterm: incoterm,

        valeur_marchandise_fob_usd: calculationResult.valeur_fob_totale_usd,
        fret_usd: Number(fretUSD),
        assurance_usd: Number(assuranceUSD),
        autres_elements_evaluation_usd: Number(autresFraisUSD),
        valeur_caf_globale_usd: calculationResult.valeur_caf_totale_usd,
        valeur_caf_globale_cdf: calculationResult.valeur_caf_totale_cdf,

        taux_change_usd_cdf: currentRate?.usd_to_cdf || 2850,
        date_taux_change: currentRate?.date || new Date().toISOString().split('T')[0],
        version_tarif_utilisee: 'SH 2022 v1.0 - DGDA RDC',

        marchandises: calculationResult.marchandises_calculees,
        regime_douanier: regimeDouanier,
        accord_commercial: accordCommercial,
        preuve_origine: preuveOrigine,
        exoneration_id: selectedExonerationId,
        exoneration_detail: selectedExo || undefined,

        total_ddi_usd: calculationResult.total_ddi_usd,
        total_accises_usd: calculationResult.total_accises_usd,
        total_tva_usd: calculationResult.total_tva_usd,
        total_fpi_usd: calculationResult.total_fpi_usd,
        total_occ_usd: calculationResult.total_occ_usd,
        total_rlf_usd: calculationResult.total_rlf_usd,
        total_autres_redevances_usd: calculationResult.total_autres_redevances_usd,
        total_droits_et_taxes_usd: calculationResult.total_droits_et_taxes_usd,
        total_droits_et_taxes_cdf: calculationResult.total_droits_et_taxes_cdf,

        frais_logistiques: calculationResult.frais_logistiques_calcules,
        total_frais_logistiques_usd: calculationResult.total_frais_logistiques_usd,
        total_frais_logistiques_cdf: calculationResult.total_frais_logistiques_cdf,

        cout_global_estime_usd: calculationResult.cout_global_estime_usd,
        cout_global_estime_cdf: calculationResult.cout_global_estime_cdf,

        observations: observations
      };

      const saved = await onSaveSimulation(fullSimulation);
      setSavedSimulationResult(saved);
      setShowSuccessScreen(true);

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

    } catch (e: any) {
      alert("Erreur lors de l'enregistrement de la simulation : " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered SH codes for inline search modal
  const filteredSHCodes = tarifSH.filter(t => {
    if (!shSearchQuery) return true;
    const q = shSearchQuery.toLowerCase();
    return t.code_sh.includes(q) || t.designation.toLowerCase().includes(q) || t.chapitre.toLowerCase().includes(q);
  }).slice(0, 15);

  // Success Screen
  if (showSuccessScreen && savedSimulationResult) {
    return (
      <div id="simulation-success-screen" className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg max-w-4xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Simulation Enregistrée avec Succès
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            Prétaxe Douanière N° <span className="text-blue-600 font-mono">{savedSimulationResult.reference}</span>
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
            L'estimation préalable des droits et taxes DGDA ainsi que des frais portuaires pour le conteneur <strong className="text-slate-800">{savedSimulationResult.conteneur_numero}</strong> au Port de Matadi est prête.
          </p>
        </div>

        {/* Quick Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-left">
          <div>
            <p className="text-xs text-slate-500 font-medium">Valeur CAF Totale :</p>
            <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
              {formatCurrencyUSD(savedSimulationResult.valeur_caf_globale_usd)}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {formatCurrencyCDF(savedSimulationResult.valeur_caf_globale_cdf)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">Droits & Taxes DGDA :</p>
            <p className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
              {formatCurrencyUSD(savedSimulationResult.total_droits_et_taxes_usd)}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {formatCurrencyCDF(savedSimulationResult.total_droits_et_taxes_cdf)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">Coût Global Estimé :</p>
            <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
              {formatCurrencyUSD(savedSimulationResult.cout_global_estime_usd)}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              {formatCurrencyCDF(savedSimulationResult.cout_global_estime_cdf)}
            </p>
          </div>
        </div>

        <LegalDisclaimerBanner compact />

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => genererPretaxePDF(savedSimulationResult)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger la Prétaxe PDF</span>
          </button>

          <button
            onClick={() => exporterSimulationExcel(savedSimulationResult)}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter vers Excel (XLSX)</span>
          </button>

          <button
            onClick={() => {
              setShowSuccessScreen(false);
              setCurrentStep(1);
            }}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-3 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle simulation</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="new-simulation-wizard" className="space-y-6">
      
      {/* Top Title & Step Indicator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Calculateur Douanier RDC
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Nouvelle simulation de dédouanement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Renseignez les données du conteneur et des marchandises pour générer le décompte détaillé de la prétaxe.
            </p>
          </div>

          {/* Quick AI & Scanner helper buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenScanner(handleOcrDataReceived)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 transition cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5 text-blue-600" />
              <span>Remplir via Scanner OCR</span>
            </button>
            <button
              onClick={() => onOpenAiAssistant((code) => {
                if (marchandises.length > 0) {
                  handleSelectSHCode(0, code);
                }
              })}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Assistant Classification SH</span>
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-5">
          {[
            { step: 1, label: '1. Conteneur & Transport' },
            { step: 2, label: '2. Importateur & Facture' },
            { step: 3, label: '3. Valeur Douane (CAF)' },
            { step: 4, label: '4. Marchandises & SH' },
            { step: 5, label: '5. Régimes & Frais' },
            { step: 6, label: '6. Prétaxe & Synthèse' }
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold text-left transition cursor-pointer border ${
                currentStep === s.step
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : currentStep > s.step
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="truncate">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Validation Errors banner if any */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Veuillez corriger les informations suivantes avant de valider :</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-red-700 pl-4">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 1 : INFORMATIONS DU CONTENEUR & TRANSPORT */}
      {/* ---------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Container className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Informations du Conteneur & Transport Maritime</h3>
              <p className="text-xs text-slate-500">Données relatives au conteneur, port de déchargement et documents maritimes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Conteneur Numero */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro du conteneur <span className="text-red-500">*</span>
              </label>
              <input
                id="input-conteneur-numero"
                type="text"
                value={conteneurNumero}
                onChange={(e) => setConteneurNumero(e.target.value.toUpperCase())}
                placeholder="ex: MSKU7829104"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 uppercase"
              />
            </div>

            {/* Type Conteneur */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type de conteneur <span className="text-red-500">*</span>
              </label>
              <select
                id="select-conteneur-type"
                value={conteneurType}
                onChange={(e) => setConteneurType(e.target.value as ContainerType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              >
                <option value="40_pieds_hc">40 pieds High Cube (40' HC)</option>
                <option value="40_pieds">40 pieds Standard (40' ST)</option>
                <option value="20_pieds">20 pieds Standard (20' ST)</option>
                <option value="vrac_conventionnel">Vrac / Conventionnel</option>
                <option value="autre">Autre type</option>
              </select>
            </div>

            {/* Port d'entrée */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Port d’entrée RDC <span className="text-red-500">*</span>
              </label>
              <select
                id="select-port-entree"
                value={portEntree}
                onChange={(e) => setPortEntree(e.target.value as PortEntree)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              >
                <option value="matadi">⚓ Port de Matadi (Kongo Central)</option>
                <option value="boma">⚓ Port de Boma (Kongo Central)</option>
                <option value="kinshasa">🚢 Port / Beach de Kinshasa</option>
                <option value="kasumbalesa">🚛 Kasumbalesa (Haut-Katanga)</option>
                <option value="goma">🚛 Goma (Nord-Kivu)</option>
                <option value="autre">Autre poste frontière</option>
              </select>
            </div>

            {/* Bill of Lading (BL) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro BL (Bill of Lading) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-bl"
                type="text"
                value={numeroBL}
                onChange={(e) => setNumeroBL(e.target.value)}
                placeholder="ex: BL-COSU89201948"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Nom du Navire */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du navire / Ligne maritime</label>
              <input
                type="text"
                value={nomNavire}
                onChange={(e) => setNomNavire(e.target.value)}
                placeholder="ex: CMA CGM MATADI EXPRESS"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Date d'arrivée */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date d’arrivée prévue</label>
              <input
                type="date"
                value={dateArriveePrevue}
                onChange={(e) => setDateArriveePrevue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Nombre de colis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de colis</label>
              <input
                type="number"
                min="1"
                value={nombreColis}
                onChange={(e) => setNombreColis(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Poids Brut */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poids brut (kg)</label>
              <input
                type="number"
                min="0"
                value={poidsBrutKg}
                onChange={(e) => setPoidsBrutKg(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Poids Net */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poids net (kg)</label>
              <input
                type="number"
                min="0"
                value={poidsNetKg}
                onChange={(e) => setPoidsNetKg(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Pays Origine */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pays d’origine</label>
              <input
                type="text"
                value={paysOrigine}
                onChange={(e) => setPaysOrigine(e.target.value)}
                placeholder="ex: Chine, Belgique, Inde"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Pays Provenance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pays de provenance</label>
              <input
                type="text"
                value={paysProvenance}
                onChange={(e) => setPaysProvenance(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Devise */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Devise de facturation</label>
              <select
                value={deviseFacturation}
                onChange={(e) => setDeviseFacturation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              >
                <option value="USD">USD ($ Dollars Américains)</option>
                <option value="EUR">EUR (€ Euros)</option>
                <option value="CDF">CDF (Francs Congolais)</option>
                <option value="RMB">RMB / CNY (Yuan Chinois)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Suivant : Importateur & Facture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 2 : INFORMATIONS COMMERCIALES & IMPORTATEUR */}
      {/* ---------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Données Commerciales, Facture & Importateur</h3>
              <p className="text-xs text-slate-500">Identifiants fiscaux (RCCM, NIF), fournisseur étranger et Incoterm</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Importateur Nom */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom ou Raison Sociale de l’Importateur <span className="text-red-500">*</span>
              </label>
              <input
                id="input-importateur-nom"
                type="text"
                value={importateurNom}
                onChange={(e) => setImportateurNom(e.target.value)}
                placeholder="ex: CONGO DISTRI ELEC SARL / ETS KABAMBA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Incoterm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Incoterm de facturation <span className="text-red-500">*</span>
              </label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value as IncotermType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              >
                <option value="CIF">CIF / CAF (Coût, Assurance, Fret)</option>
                <option value="FOB">FOB (Free On Board)</option>
                <option value="CFR">CFR (Coût et Fret)</option>
                <option value="EXW">EXW (Départ Usine)</option>
                <option value="CIP">CIP (Port Payé, Assurance)</option>
                <option value="DAP">DAP (Rendu au Lieu de Destination)</option>
                <option value="autre">Autre Incoterm</option>
              </select>
            </div>

            {/* RCCM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Numéro RCCM</label>
              <input
                type="text"
                value={importateurRCCM}
                onChange={(e) => setImportateurRCCM(e.target.value)}
                placeholder="ex: CD/KIN/RCCM/19-B-01452"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* NIF */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Numéro Fiscal (NIF)</label>
              <input
                type="text"
                value={importateurNIF}
                onChange={(e) => setImportateurNIF(e.target.value)}
                placeholder="ex: A1904589Z"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* ID NAT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Identification Nationale (ID NAT)</label>
              <input
                type="text"
                value={importateurIDNat}
                onChange={(e) => setImportateurIDNat(e.target.value)}
                placeholder="ex: 01-83-N45892P"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Adresse */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse de l’importateur en RDC</label>
              <input
                type="text"
                value={importateurAdresse}
                onChange={(e) => setImportateurAdresse(e.target.value)}
                placeholder="ex: Avenue du Commerce n° 14, Gombe, Kinshasa"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de contact</label>
              <input
                type="text"
                value={importateurTelephone}
                onChange={(e) => setImportateurTelephone(e.target.value)}
                placeholder="ex: +243 81 555 4321"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Fournisseur */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Fournisseur / Exportateur</label>
              <input
                type="text"
                value={fournisseurNom}
                onChange={(e) => setFournisseurNom(e.target.value)}
                placeholder="ex: GUANGZHOU TRADING CO., LTD"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Pays Fournisseur */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pays du Fournisseur</label>
              <input
                type="text"
                value={fournisseurPays}
                onChange={(e) => setFournisseurPays(e.target.value)}
                placeholder="ex: Chine, Émirats Arabes Unis, Turquie"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* N° Facture */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de la Facture Commerciale</label>
              <input
                type="text"
                value={numeroFacture}
                onChange={(e) => setNumeroFacture(e.target.value)}
                placeholder="ex: INV-2026-CN-889"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Date Facture */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date de la Facture</label>
              <input
                type="date"
                value={dateFacture}
                onChange={(e) => setDateFacture(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>

          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Suivant : Valeur Douane (CAF)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 3 : ÉVALUATION EN DOUANE & CALCUL VALEUR CAF */}
      {/* ---------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">3. Évaluation en Douane : Calcul de la Valeur CAF (CIF)</h3>
              <p className="text-xs text-slate-500">Règles d’évaluation douanière DGDA : Valeur CAF = Valeur FOB + Fret maritime + Assurance + Ajustements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Fret USD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fret Maritime / Transport Global (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={fretUSD}
                onChange={(e) => setFretUSD(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Sera réparti au prorata de la valeur FOB des marchandises</p>
            </div>

            {/* Assurance USD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assurance Maritime Globale (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={assuranceUSD}
                onChange={(e) => setAssuranceUSD(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Assurance facultés ou police d’assurance RDC (SONAS/Privée)</p>
            </div>

            {/* Autres ajustements */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Autres éléments d’évaluation (USD)
              </label>
              <input
                type="number"
                min="0"
                value={autresFraisUSD}
                onChange={(e) => setAutresFraisUSD(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Commissions, emballages, redevances selon Accord d’évaluation OMC</p>
            </div>

          </div>

          {/* Live Customs Value Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl p-5 text-white border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Décomposition de la Valeur en Douane
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Taux DGDA : 1 USD = {currentRate?.usd_to_cdf} CDF
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">1. Valeur FOB (Marchandises) :</span>
                <p className="text-base font-bold text-white font-mono mt-0.5">
                  {formatCurrencyUSD(calculationResult.valeur_fob_totale_usd)}
                </p>
              </div>

              <div>
                <span className="text-slate-400">2. Fret Maritime :</span>
                <p className="text-base font-bold text-white font-mono mt-0.5">
                  {formatCurrencyUSD(fretUSD)}
                </p>
              </div>

              <div>
                <span className="text-slate-400">3. Assurance Maritime :</span>
                <p className="text-base font-bold text-white font-mono mt-0.5">
                  {formatCurrencyUSD(assuranceUSD)}
                </p>
              </div>

              <div className="bg-blue-900/50 p-2.5 rounded-lg border border-blue-600/50">
                <span className="text-amber-300 font-bold">4. VALEUR CAF TOTALE :</span>
                <p className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                  {formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}
                </p>
                <p className="text-[11px] text-slate-300 font-mono">
                  {formatCurrencyCDF(calculationResult.valeur_caf_totale_cdf)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Suivant : Marchandises & Codes SH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 4 : MARCHANDISES & CLASSIFICATION SH (MULTI-LIGNES) */}
      {/* ---------------------------------------------------- */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">4. Lignes de Marchandises & Codes SH 2022</h3>
                <p className="text-xs text-slate-500">Un conteneur peut contenir plusieurs articles classés selon la nomenclature officielle DGDA</p>
              </div>
            </div>

            <button
              id="btn-add-marchandise"
              onClick={handleAddMarchandise}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Ajouter une marchandise</span>
            </button>
          </div>

          {/* Marchandises Items List */}
          <div className="space-y-4">
            {marchandises.map((item, index) => {
              const matchedSH = tarifSH.find(t => t.code_sh === item.code_sh);

              return (
                <div key={item.id || index} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  
                  {/* Top line with item index and remove */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Ligne de Marchandise #{index + 1}
                      </span>
                      {matchedSH && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                          DDI: {matchedSH.taux_droit_douane}% | TVA: {matchedSH.taux_tva}% | Accises: {matchedSH.taux_accise}%
                        </span>
                      )}
                    </div>

                    {marchandises.length > 1 && (
                      <button
                        onClick={() => handleRemoveMarchandise(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    
                    {/* Designation */}
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Désignation commerciale <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.designation || ''}
                        onChange={(e) => handleUpdateMarchandise(index, 'designation', e.target.value)}
                        placeholder="ex: Riz blanc 5% brisures"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Code SH with Search helper */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Code SH (8 chiffres) <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMarchandiseIndexForSearch(index);
                            setShSearchQuery(item.designation || '');
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>Rechercher SH</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.code_sh || ''}
                        onChange={(e) => handleUpdateMarchandise(index, 'code_sh', e.target.value)}
                        placeholder="ex: 1006.30.00"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quantité & Unité */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité & Unité</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantite || 1}
                          onChange={(e) => handleUpdateMarchandise(index, 'quantite', Number(e.target.value))}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-slate-900"
                        />
                        <select
                          value={item.unite || 'Unité'}
                          onChange={(e) => handleUpdateMarchandise(index, 'unite', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs font-medium text-slate-800"
                        >
                          <option value="Unité">Unité</option>
                          <option value="kg">kg</option>
                          <option value="Tonne">Tonne</option>
                          <option value="Set">Set</option>
                          <option value="Carton">Carton</option>
                          <option value="Balle">Balle</option>
                          <option value="litre">Litre</option>
                          <option value="m²">m²</option>
                          <option value="Paire">Paire</option>
                        </select>
                      </div>
                    </div>

                    {/* Prix Unitaire USD */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Prix Unit. FOB ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.prix_unitaire_usd || 0}
                        onChange={(e) => handleUpdateMarchandise(index, 'prix_unitaire_usd', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                  </div>

                  {/* Calculated Line summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-4">
                      <span>Valeur FOB : <strong>{formatCurrencyUSD((item.quantite || 1) * (item.prix_unitaire_usd || 0))}</strong></span>
                      <span>Origine : <strong>{item.pays_origine || paysOrigine}</strong></span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-bold">
                        Taux DDI officiel : {item.taux_ddi || 10}% {item.taux_accise ? `+ Accises ${item.taux_accise}%` : ''}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Suivant : Régimes & Frais Portuaires</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 5 : RÉGIMES, EXONÉRATIONS & FRAIS LOGISTIQUES */}
      {/* ---------------------------------------------------- */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          {/* Section 1 : Régime & Exonérations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">5. Régimes Douaniers & Exonérations Légales</h3>
                <p className="text-xs text-slate-500">Choisissez le régime douanier applicable et les éventuels accords préférentiels</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Régime */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Régime Douanier Principal <span className="text-red-500">*</span>
                </label>
                <select
                  value={regimeDouanier}
                  onChange={(e) => setRegimeDouanier(e.target.value as RegimeDouanier)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="mise_a_la_consommation">Mise à la consommation directe (C100 / IM4 - DDI + TVA + Taxes)</option>
                  <option value="importation_temporaire">Importation Temporaire (IM5 - Régime suspensif avec caution)</option>
                  <option value="entrepot_douanier">Entrepôt de douane (IM7 - Suspension totale des droits)</option>
                  <option value="transit">Transit Douanier (IM8 / T1 - Port de Matadi vers Kinshasa/Intérieur)</option>
                  <option value="reimportation">Réimportation en l’état (IM6)</option>
                  <option value="zone_franche_zes">Zone Économique Spéciale (ZES / Zone Franche)</option>
                </select>
              </div>

              {/* Exonération */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agrément ou Exonération Réglementaire
                </label>
                <select
                  value={selectedExonerationId}
                  onChange={(e) => setSelectedExonerationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="">Aucune exonération (Régime fiscal commun plein)</option>
                  {DEFAULT_EXONERATIONS.map((exo) => (
                    <option key={exo.id} value={exo.id}>
                      {exo.titre}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {selectedExo && (
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Exonération active : {selectedExo.titre}</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Base légale : {selectedExo.base_legale} | Document requis : {selectedExo.document_justificatif}
                </p>
                <p className="text-[11px] font-semibold text-purple-950">
                  Taux exonéré : DDI ({selectedExo.taux_exoneration_ddi}%) • TVA ({selectedExo.taux_exoneration_tva}%) • Accises ({selectedExo.taux_exoneration_accises}%)
                </p>
              </div>
            )}
          </div>

          {/* Section 2 : Frais Logistiques et Portuaires (Matadi) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2.5 pb-2">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Frais Logistiques et Portuaires (Non Fiscaux)</h3>
                <p className="text-xs text-slate-500">Estimations distinctes des droits de douane : Manutention SCTP, Scanning, Magasinage, CAD</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fraisLogistiques.map((frais) => (
                <div
                  key={frais.id}
                  className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                    frais.actif ? 'bg-white border-blue-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={frais.actif}
                      onChange={() => handleToggleFrais(frais.id)}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{frais.libelle}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{frais.prestataire}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={frais.montant_usd}
                        onChange={(e) => handleUpdateFraisAmount(frais.id, Number(e.target.value))}
                        disabled={!frais.actif}
                        className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-right text-slate-900 focus:bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatCurrencyCDF(frais.montant_usd * (currentRate?.usd_to_cdf || 2850))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Total Frais Logistiques Port de Matadi activés :</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono">
                {formatCurrencyUSD(calculationResult.total_frais_logistiques_usd)} ({formatCurrencyCDF(calculationResult.total_frais_logistiques_cdf)})
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              onClick={() => setCurrentStep(6)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Suivant : Synthèse de la Prétaxe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 6 : MODULE PRÉTAXE & SYNTHÈSE TRANSPARENTE */}
      {/* ---------------------------------------------------- */}
      {currentStep === 6 && (
        <div className="space-y-6">
          
          <LegalDisclaimerBanner />

          {/* Main Pretax Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Résultat du Pré-Calcul Douanier
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Prétaxe / Estimation Douanière — Port de Matadi
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Tarif SH 2022 DGDA • Taux de change appliqué : 1 USD = {currentRate?.usd_to_cdf} CDF
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="btn-save-simulation"
                  onClick={handleFinalSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Simulation'}</span>
                </button>
              </div>
            </div>

            {/* Top Summaries (Container + CAF) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Conteneur Info Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                  Données du Conteneur & Transport
                </h4>
                <div className="flex justify-between"><span className="text-slate-500">N° Conteneur :</span><span className="font-mono font-bold text-slate-900">{conteneurNumero || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type :</span><span className="font-semibold text-slate-800">{conteneurType}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Port d’entrée :</span><span className="font-semibold text-blue-700 uppercase font-mono">{portEntree}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">BL / Facture :</span><span className="font-mono text-slate-700">{numeroBL || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Importateur :</span><span className="font-semibold text-slate-900">{importateurNom || 'N/A'}</span></div>
              </div>

              {/* Customs Value Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                  Valeur en Douane (CAF / CIF)
                </h4>
                <div className="flex justify-between"><span className="text-slate-500">Valeur Marchandises (FOB) :</span><span className="font-mono font-semibold text-slate-900">{formatCurrencyUSD(calculationResult.valeur_fob_totale_usd)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fret maritime :</span><span className="font-mono font-semibold text-slate-900">{formatCurrencyUSD(fretUSD)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Assurance :</span><span className="font-mono font-semibold text-slate-900">{formatCurrencyUSD(assuranceUSD)}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-amber-900 font-bold">
                  <span>VALEUR CAF TOTALE :</span>
                  <span className="font-mono text-sm">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  ≈ {formatCurrencyCDF(calculationResult.valeur_caf_totale_cdf)}
                </div>
              </div>

            </div>

            {/* Detailed Duties and Taxes Breakdown Table */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Décompte Transparent des Droits, Taxes & Redevances DGDA
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Libellé de la Taxe</th>
                      <th className="py-2.5 px-3">Base Taxable</th>
                      <th className="py-2.5 px-3">Taux Appliqué</th>
                      <th className="py-2.5 px-3 text-right">Montant (USD)</th>
                      <th className="py-2.5 px-3 text-right">Montant (CDF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    
                    {/* DDI */}
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Droit de Douane à l’Importation (DDI)
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">Selon Code SH (0 à 20%)</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(calculationResult.total_ddi_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_ddi_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* Accises */}
                    {calculationResult.total_accises_usd > 0 && (
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          Droits d’Accises (DA)
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd + calculationResult.total_ddi_usd)}</td>
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-bold">Code des Accises</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(calculationResult.total_accises_usd)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_accises_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                      </tr>
                    )}

                    {/* TVA */}
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Taxe sur la Valeur Ajoutée (TVA)
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {formatCurrencyUSD(calculationResult.valeur_caf_totale_usd + calculationResult.total_ddi_usd + calculationResult.total_accises_usd)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">16.0 % légal</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrencyUSD(calculationResult.total_tva_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_tva_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* RLF */}
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">Redevance Logistique Ferroviaire (RLF / OGEFREM)</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">1.5 %</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatCurrencyUSD(calculationResult.total_rlf_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_rlf_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* FPI */}
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">Fonds de Promotion de l’Industrie (FPI)</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">2.0 %</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatCurrencyUSD(calculationResult.total_fpi_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_fpi_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* OCC */}
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">Office Congolais de Contrôle (OCC - Conformité)</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrencyUSD(calculationResult.valeur_caf_totale_usd)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">1.5 %</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatCurrencyUSD(calculationResult.total_occ_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_occ_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* DGRAD Timbre */}
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">Frais Informatiques & Timbre Sydonia World</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">Forfaitaire</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">Forfait DGDA</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatCurrencyUSD(calculationResult.total_autres_redevances_usd)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrencyCDF(calculationResult.total_autres_redevances_usd * (currentRate?.usd_to_cdf || 2850))}</td>
                    </tr>

                    {/* Sous-total Droits & Taxes */}
                    <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                      <td colSpan={3} className="py-3 px-3 uppercase">
                        TOTAL DROITS ET TAXES DGDA (FISCAL)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                        {formatCurrencyUSD(calculationResult.total_droits_et_taxes_usd)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        {formatCurrencyCDF(calculationResult.total_droits_et_taxes_cdf)}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Frais Logistiques */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Total Frais Logistiques Portuaires (Matadi) :</span>
                <p className="text-[11px] text-slate-500">THC, Scanning, Magasinage SCTP, Déclarant CAD</p>
              </div>
              <div className="text-right font-mono font-bold text-slate-900">
                <span className="text-sm">{formatCurrencyUSD(calculationResult.total_frais_logistiques_usd)}</span>
                <span className="text-slate-400 ml-2">({formatCurrencyCDF(calculationResult.total_frais_logistiques_cdf)})</span>
              </div>
            </div>

            {/* GRAND TOTAL BANNER */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs bg-amber-500 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Estimation Globale
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  COÛT ESTIMATIF GLOBAL DU DÉDOUANEMENT
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Droits & Taxes DGDA + Frais Logistiques & Portuaires Port de Matadi
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                  {formatCurrencyUSD(calculationResult.cout_global_estime_usd)}
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1">
                  ≈ {formatCurrencyCDF(calculationResult.cout_global_estime_cdf)}
                </div>
              </div>
            </div>

            {/* Transparent Calculation Formulas Step-by-Step */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Formules de Calcul & Démonstration Mathématique</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calculationResult.details_transparence.map((detail, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{detail.etape}</span>
                      <span className="text-blue-700 font-mono">{detail.taux_applique}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{detail.description}</p>
                    <div className="bg-white p-2 rounded border border-slate-200/80 font-mono text-[11px] text-slate-800 break-all">
                      {detail.formule}
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900 text-xs">
                      = {formatCurrencyUSD(detail.resultat_usd)} ({formatCurrencyCDF(detail.resultat_cdf)})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observations & Notes particulières sur le dossier
              </label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="ex: Conteneur sous franchise portuaire de 7 jours, certificat d'inspection BIVAC validé..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white"
              />
            </div>

          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              onClick={handleFinalSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Enregistrer la Prétaxe</span>
            </button>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INLINE SH CODE SEARCH MODAL */}
      {/* ---------------------------------------------------- */}
      {activeMarchandiseIndexForSearch !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Recherche dans le Tarif DGDA SH 2022
                </h3>
                <p className="text-xs text-slate-500">
                  Sélectionnez le code SH officiel à 8 chiffres pour la marchandise #{activeMarchandiseIndexForSearch + 1}
                </p>
              </div>
              <button
                onClick={() => setActiveMarchandiseIndexForSearch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                value={shSearchQuery}
                onChange={(e) => setShSearchQuery(e.target.value)}
                placeholder="Tapez un mot-clé (ex: riz, climatiseur, pneu, friperie, ciment...)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-1">
              {filteredSHCodes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Aucun code SH correspondant trouvé pour "{shSearchQuery}".
                </div>
              ) : (
                filteredSHCodes.map((code) => (
                  <div
                    key={code.id}
                    onClick={() => handleSelectSHCode(activeMarchandiseIndexForSearch, code)}
                    className="p-3 rounded-xl hover:bg-blue-50/80 transition cursor-pointer border border-transparent hover:border-blue-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900 text-xs bg-blue-100 px-2 py-0.5 rounded">
                          {code.code_sh}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {code.designation}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {code.chapitre} • {code.section}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        DDI : {code.taux_droit_douane}%
                      </span>
                      {code.taux_accise > 0 && (
                        <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                          Accise: {code.taux_accise}%
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveMarchandiseIndexForSearch(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
