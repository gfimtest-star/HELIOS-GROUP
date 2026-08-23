import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  DashboardView 
} from './components/DashboardView';
import { 
  NewSimulationView 
} from './components/NewSimulationView';
import { 
  SimulationsListView 
} from './components/SimulationsListView';
import { 
  TarifCatalogView 
} from './components/TarifCatalogView';
import { 
  QuickCalculatorView 
} from './components/QuickCalculatorView';
import { 
  ExchangeRatesView 
} from './components/ExchangeRatesView';
import { 
  AdministrationView 
} from './components/AdministrationView';
import { 
  VehicleCalculatorView 
} from './components/VehicleCalculatorView';
import { 
  DemurrageCalculatorView 
} from './components/DemurrageCalculatorView';
import { 
  RegimesComparatorView 
} from './components/RegimesComparatorView';
import { 
  CustomsProceduresGuideView 
} from './components/CustomsProceduresGuideView';
import { 
  AiAssistantModal 
} from './components/AiAssistantModal';
import { 
  DocumentScannerModal 
} from './components/DocumentScannerModal';
import { 
  SimulationDetailsModal 
} from './components/SimulationDetailsModal';

import { 
  SimulationDédouanement, 
  CodeTarifaireSH, 
  ExchangeRateConfig, 
  TaxRuleConfig, 
  Exoneration, 
  AuditLog, 
  UserRole 
} from './types/customs';

import { 
  DEFAULT_TARIF_SH_2022, 
  DEFAULT_EXCHANGE_RATE, 
  DEFAULT_TAX_RULES, 
  DEFAULT_EXONERATIONS, 
  DEFAULT_LOGISTIC_FEES_MATADI 
} from './data/defaultSettings';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Déclarant en Douane');

  // Application Data States
  const [simulations, setSimulations] = useState<SimulationDédouanement[]>([]);
  const [tarifSH, setTarifSH] = useState<CodeTarifaireSH[]>(DEFAULT_TARIF_SH_2022);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateConfig[]>([DEFAULT_EXCHANGE_RATE]);
  const [currentRate, setCurrentRate] = useState<ExchangeRateConfig>(DEFAULT_EXCHANGE_RATE);
  const [taxRules, setTaxRules] = useState<TaxRuleConfig[]>(DEFAULT_TAX_RULES);
  const [exonerations, setExonerations] = useState<Exoneration[]>(DEFAULT_EXONERATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals & Editing State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiSelectCallback, setAiSelectCallback] = useState<((code: CodeTarifaireSH) => void) | undefined>(undefined);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [selectedSimulationForDetail, setSelectedSimulationForDetail] = useState<SimulationDédouanement | null>(null);
  
  // Pre-fill state for wizard (e.g. duplicating or editing or applying from code/scan)
  const [wizardInitialData, setWizardInitialData] = useState<Partial<SimulationDédouanement> | null>(null);

  // ----------------------------------------------------
  // Load data from Backend API on Mount
  // ----------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch simulations
      try {
        const simRes = await fetch('/api/simulations');
        if (simRes.ok) {
          const simData = await simRes.json();
          if (Array.isArray(simData)) {
            setSimulations(simData);
          }
        }
      } catch (err) {
        console.warn('API simulations fallback to local storage', err);
      }

      // 2. Fetch Tariff
      try {
        const tarifRes = await fetch('/api/tarif');
        if (tarifRes.ok) {
          const tarifData = await tarifRes.json();
          if (Array.isArray(tarifData) && tarifData.length > 0) {
            setTarifSH(tarifData);
          }
        }
      } catch (err) {
        console.warn('API tarif fallback to defaults', err);
      }

      // 3. Fetch Exchange Rates
      try {
        const rateRes = await fetch('/api/exchange-rates');
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          if (Array.isArray(rateData) && rateData.length > 0) {
            setExchangeRates(rateData);
            const active = rateData.find((r: any) => r.actif) || rateData[0];
            setCurrentRate(active);
          }
        }
      } catch (err) {
        console.warn('API exchange rates fallback', err);
      }

      // 4. Fetch Tax Rules
      try {
        const rulesRes = await fetch('/api/tax-rules');
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (Array.isArray(rulesData) && rulesData.length > 0) {
            setTaxRules(rulesData);
          }
        }
      } catch (err) {
        console.warn('API tax rules fallback', err);
      }

      // 5. Fetch Audit Logs
      try {
        const auditRes = await fetch('/api/audit-logs');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (Array.isArray(auditData)) {
            setAuditLogs(auditData);
          }
        }
      } catch (err) {
        console.warn('API audit logs fallback', err);
      }

    } catch (globalErr) {
      console.error('Erreur lors du chargement des données :', globalErr);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----------------------------------------------------
  // Handlers for Simulations
  // ----------------------------------------------------
  const handleSaveSimulation = async (simData: Partial<SimulationDédouanement>) => {
    try {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...simData,
          cree_par: `Utilisateur (${userRole})`
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l’enregistrement de la simulation');
      }

      const saved: SimulationDédouanement = await response.json();
      
      // Update local state
      setSimulations(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
      setWizardInitialData(null);
      setActiveTab('simulations');
      setSelectedSimulationForDetail(saved);
      fetchData(); // Refresh audit logs
    } catch (err: any) {
      console.error(err);
      alert('Erreur : ' + err.message);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      await fetch(`/api/simulations/${id}`, { method: 'DELETE' });
      setSimulations(prev => prev.filter(s => s.id !== id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateSimulation = (sim: SimulationDédouanement) => {
    const duplicated: Partial<SimulationDédouanement> = {
      ...sim,
      id: undefined,
      reference: undefined,
      date_creation: new Date().toISOString(),
      statut: 'simulation'
    };
    setWizardInitialData(duplicated);
    setActiveTab('new-simulation');
  };

  // ----------------------------------------------------
  // Handlers for Tariff & Rates
  // ----------------------------------------------------
  const handleAddTarifItem = async (item: Partial<CodeTarifaireSH>) => {
    const response = await fetch('/api/tarif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur lors de l’ajout du code');
    }
    const created = await response.json();
    setTarifSH(prev => [created, ...prev]);
    fetchData();
  };

  const handleImportBulkTarif = async (items: any[], version: string) => {
    const response = await fetch('/api/tarif/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, version_tarif: version })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur lors de l’importation');
    }
    fetchData();
  };

  const handleUpdateRate = async (rateData: Partial<ExchangeRateConfig>) => {
    const response = await fetch('/api/exchange-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rateData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur de mise à jour du taux');
    }
    const updated = await response.json();
    setCurrentRate(updated);
    setExchangeRates(prev => [updated, ...prev.map(r => ({ ...r, actif: false }))]);
    fetchData();
  };

  const handleUpdateTaxRule = async (ruleId: string, updated: Partial<TaxRuleConfig>) => {
    const response = await fetch(`/api/tax-rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (response.ok) {
      fetchData();
    }
  };

  const handleAddExoneration = async (exo: Partial<Exoneration>) => {
    setExonerations(prev => [{ ...exo, id: `exo-${Date.now()}` } as Exoneration, ...prev]);
  };

  // Trigger AI assistant modal with optional callback
  const handleOpenAiAssistant = (onSelect?: (code: CodeTarifaireSH) => void) => {
    setAiSelectCallback(() => onSelect);
    setIsAiModalOpen(true);
  };

  // Handler to use code in simulation
  const handleUseCodeInSimulation = (code: CodeTarifaireSH) => {
    setWizardInitialData({
      marchandises: [
        {
          id: `line-${Date.now()}`,
          code_sh: code.code_sh,
          designation: code.designation,
          quantite: 100,
          unite: code.unite_taxation || 'Unité',
          valeur_fob_unitaire_usd: 50,
          valeur_fob_totale_usd: 5000,
          fret_alloue_usd: 500,
          assurance_allouee_usd: 50,
          valeur_caf_usd: 5550,
          taux_ddi: code.taux_droit_douane,
          taux_accise: code.taux_accise || 0,
          taux_tva: code.taux_tva || 16,
          taux_rlf: 1.5,
          taux_fpi: 2.0,
          taux_occ: 1.5,
          montant_ddi_usd: (5550 * code.taux_droit_douane) / 100,
          montant_accise_usd: 0,
          montant_tva_usd: (5550 * 16) / 100,
          montant_rlf_usd: (5550 * 1.5) / 100,
          montant_fpi_usd: (5550 * 2.0) / 100,
          montant_occ_usd: (5550 * 1.5) / 100,
          total_droits_taxes_usd: 0
        }
      ]
    });
    setActiveTab('new-simulation');
  };

  // OCR Extracted data transfer to Wizard
  const handleDataExtractedFromScanner = (extracted: any) => {
    const marchs = (extracted.marchandises || []).map((m: any, idx: number) => {
      const qte = Number(m.quantite) || 1;
      const pu = Number(m.prix_unitaire_usd) || 100;
      const fob = qte * pu;
      return {
        id: `extracted-${idx}-${Date.now()}`,
        code_sh: m.code_sh_suggere || '1006.30.00',
        designation: m.designation || 'Marchandise importée',
        quantite: qte,
        unite: m.unite || 'U',
        valeur_fob_unitaire_usd: pu,
        valeur_fob_totale_usd: fob,
        fret_alloue_usd: 0,
        assurance_allouee_usd: 0,
        valeur_caf_usd: fob,
        taux_ddi: 10,
        taux_accise: 0,
        taux_tva: 16,
        taux_rlf: 1.5,
        taux_fpi: 2.0,
        taux_occ: 1.5,
        montant_ddi_usd: fob * 0.1,
        montant_accise_usd: 0,
        montant_tva_usd: fob * 0.16,
        montant_rlf_usd: fob * 0.015,
        montant_fpi_usd: fob * 0.02,
        montant_occ_usd: fob * 0.015,
        total_droits_taxes_usd: fob * (0.1 + 0.16 + 0.05)
      };
    });

    setWizardInitialData({
      importateur_nom: extracted.importateur_nom || '',
      importateur_nif: extracted.importateur_nif || '',
      fournisseur_nom: extracted.fournisseur_nom || '',
      fournisseur_pays: extracted.fournisseur_pays || '',
      numero_facture: extracted.numero_facture || '',
      numero_bl: extracted.numero_bl || '',
      conteneur_numero: extracted.conteneur_numero || '',
      port_entree: (extracted.port_debarquement?.toLowerCase().includes('matadi') ? 'matadi' : 'matadi') as any,
      fret_usd: Number(extracted.fret_usd) || 1500,
      assurance_usd: Number(extracted.assurance_usd) || 150,
      marchandises: marchs.length > 0 ? marchs : undefined
    });

    setActiveTab('new-simulation');
  };

  return (
    <div id="douane-calcul-app" className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* Top Main Navbar */}
      <Navbar
        currentRate={currentRate}
        userRole={userRole}
        onRoleChange={setUserRole}
        onOpenAiAssistant={() => handleOpenAiAssistant()}
        onOpenScanner={() => setIsScannerModalOpen(true)}
      />

      <div className="flex-1 flex w-full max-w-[1700px] mx-auto">
        
        {/* Left Side Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'new-simulation') {
              setWizardInitialData(null);
            }
            setActiveTab(tab);
          }}
          simulationsCount={simulations.length}
          tarifCount={tarifSH.length}
        />

        {/* Central Content Area */}
        <main className="flex-1 bg-slate-100/90 rounded-tl-3xl p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-70px)] overflow-x-hidden">
          
          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <DashboardView
              simulations={simulations}
              currentRate={currentRate}
              onNewSimulation={() => {
                setWizardInitialData(null);
                setActiveTab('new-simulation');
              }}
              onViewSimulation={(sim) => setSelectedSimulationForDetail(sim)}
              onNavigate={setActiveTab}
            />
          )}

          {/* 2. NEW SIMULATION WIZARD */}
          {activeTab === 'new-simulation' && (
            <NewSimulationView
              tarifSH={tarifSH}
              currentRate={currentRate}
              onSaveSimulation={handleSaveSimulation}
              onCancel={() => setActiveTab('simulations')}
              onOpenAiAssistant={handleOpenAiAssistant}
              onOpenScanner={() => setIsScannerModalOpen(true)}
              initialData={wizardInitialData || undefined}
            />
          )}

          {/* 3. SIMULATIONS HISTORY LIST */}
          {activeTab === 'simulations' && (
            <SimulationsListView
              simulations={simulations}
              onNewSimulation={() => {
                setWizardInitialData(null);
                setActiveTab('new-simulation');
              }}
              onViewSimulation={(sim) => setSelectedSimulationForDetail(sim)}
              onDuplicateSimulation={handleDuplicateSimulation}
              onDeleteSimulation={handleDeleteSimulation}
            />
          )}

          {/* 3.1 VEHICLE CUSTOMS CALCULATOR (ARGUS DGDA) */}
          {activeTab === 'vehicle-calc' && (
            <VehicleCalculatorView
              currentRate={currentRate}
              onImportToSimulation={(simData) => {
                setWizardInitialData(simData);
                setActiveTab('new-simulation');
              }}
            />
          )}

          {/* 3.2 DEMURRAGE & PORT STORAGE CALCULATOR */}
          {activeTab === 'demurrage-calc' && (
            <DemurrageCalculatorView
              currentRate={currentRate}
            />
          )}

          {/* 3.3 REGIMES COMPARATOR (IM4 vs IM5 vs IM7 vs IM8) */}
          {activeTab === 'regimes-compare' && (
            <RegimesComparatorView
              currentRate={currentRate}
            />
          )}

          {/* 3.4 CUSTOMS CLEARANCE PROCEDURES & CHECKLIST GUIDE */}
          {activeTab === 'procedures-guide' && (
            <CustomsProceduresGuideView />
          )}

          {/* 4. TARIFF NOMENCLATURE CATALOG */}
          {activeTab === 'tarif' && (
            <TarifCatalogView
              tarifSH={tarifSH}
              onOpenAiAssistant={handleOpenAiAssistant}
              onUseCodeInSimulation={handleUseCodeInSimulation}
            />
          )}

          {/* 5. QUICK EXPRESS CALCULATOR */}
          {activeTab === 'quick-calc' && (
            <QuickCalculatorView
              tarifSH={tarifSH}
              currentRate={currentRate}
              onNavigateToNewSimulation={() => {
                setWizardInitialData(null);
                setActiveTab('new-simulation');
              }}
            />
          )}

          {/* 6. EXCHANGE RATES & CONVERTER */}
          {activeTab === 'rates' && (
            <ExchangeRatesView
              rates={exchangeRates}
              currentRate={currentRate}
              onUpdateRate={handleUpdateRate}
              userRole={userRole}
            />
          )}

          {/* 7. ADMINISTRATION & AUDIT LOG */}
          {activeTab === 'admin' && (
            <AdministrationView
              tarifSH={tarifSH}
              taxRules={taxRules}
              exonerations={exonerations}
              auditLogs={auditLogs}
              onAddTarifItem={handleAddTarifItem}
              onImportBulkTarif={handleImportBulkTarif}
              onUpdateTaxRule={handleUpdateTaxRule}
              onAddExoneration={handleAddExoneration}
              userRole={userRole}
            />
          )}

        </main>

      </div>

      {/* Global AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => {
          setIsAiModalOpen(false);
          setAiSelectCallback(undefined);
        }}
        onSelectCode={aiSelectCallback || handleUseCodeInSimulation}
      />

      {/* Global Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onDataExtracted={handleDataExtractedFromScanner}
      />

      {/* Full Detail & Pretaxe Modal */}
      <SimulationDetailsModal
        simulation={selectedSimulationForDetail}
        onClose={() => setSelectedSimulationForDetail(null)}
      />

    </div>
  );
}
