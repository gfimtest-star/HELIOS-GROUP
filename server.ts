import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { OFFICIAL_TARIF_SH_2022 } from './src/data/officialTarifSH2022';
import { DEFAULT_EXCHANGE_RATES, DEFAULT_TAX_RULES, DEFAULT_LOGISTIC_FEES_MATADI, DEFAULT_EXONERATIONS } from './src/data/defaultSettings';
import { SimulationDédouanement, CodeTarifaireSH, ExchangeRateConfig, TaxRuleConfig, Exoneration, AuditLog } from './src/types/customs';

// Initialize server
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Persistence file paths
const DATA_DIR = path.join(process.cwd(), '.customs_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SIMULATIONS_FILE = path.join(DATA_DIR, 'simulations.json');
const TARIF_FILE = path.join(DATA_DIR, 'tarif.json');
const RATES_FILE = path.join(DATA_DIR, 'rates.json');
const TAX_RULES_FILE = path.join(DATA_DIR, 'tax_rules.json');
const EXONERATIONS_FILE = path.join(DATA_DIR, 'exonerations.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

// In-memory cache with fallback to defaults
function loadData<T>(file: string, defaultValue: T): T {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error loading data from ${file}:`, e);
  }
  return defaultValue;
}

function saveData<T>(file: string, data: T) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error saving data to ${file}:`, e);
  }
}

// Initial default simulations data
const INITIAL_SIMULATIONS: SimulationDédouanement[] = [
  {
    id: 'sim-2026-mat-001',
    reference: 'SIM-2026-MAT-0001',
    date_creation: '2026-08-18T10:30:00Z',
    date_modification: '2026-08-18T11:00:00Z',
    statut: 'validee',
    conteneur_numero: 'MSKU7829104',
    conteneur_type: '40_pieds_hc',
    nombre_colis: 650,
    poids_brut_kg: 24500,
    poids_net_kg: 23200,
    port_entree: 'matadi',
    nom_navire: 'CMA CGM MATADI EXPRESS',
    pays_origine: 'Chine',
    pays_provenance: 'Chine',
    pays_expedition: 'Chine',
    date_arrivee_prevue: '2026-09-02',
    numero_bl: 'BL-COSU89201948',
    numero_facture: 'INV-2026-CN-889',
    devise_facturation: 'USD',
    importateur_nom: 'CONGO DISTRI ELEC SARL',
    importateur_adresse: 'Avenue du Commerce n° 14, Gombe, Kinshasa',
    importateur_rccm: 'CD/KIN/RCCM/19-B-01452',
    importateur_id_nat: '01-83-N45892P',
    importateur_nif: 'A1904589Z',
    importateur_telephone: '+243 81 555 4321',
    importateur_email: 'contact@congodistri.cd',
    fournisseur_nom: 'GUANGZHOU GREE ELECTRIC CO., LTD',
    fournisseur_pays: 'Chine',
    date_facture: '2026-07-28',
    incoterm: 'CIF',
    valeur_marchandise_fob_usd: 35000,
    fret_usd: 4800,
    assurance_usd: 600,
    autres_elements_evaluation_usd: 0,
    valeur_caf_globale_usd: 40400,
    valeur_caf_globale_cdf: 115140000,
    taux_change_usd_cdf: 2850,
    date_taux_change: '2026-08-21',
    version_tarif_utilisee: 'SH 2022 v1.0',
    regime_douanier: 'mise_a_la_consommation',
    marchandises: [
      {
        id: 'm-1',
        designation: 'Climatiseurs split 12000 BTU Inverter R32',
        code_sh: '8415.10.00',
        quantite: 150,
        unite: 'Set',
        prix_unitaire_usd: 160,
        valeur_fob_usd: 24000,
        fret_reparti_usd: 3291.43,
        assurance_repartie_usd: 411.43,
        autres_frais_usd: 0,
        valeur_caf_usd: 27702.86,
        valeur_caf_cdf: 78953151,
        poids_kg: 16500,
        pays_origine: 'Chine',
        taux_ddi: 20,
        taux_accise: 0,
        taux_tva: 16,
        taux_fpi: 2.0,
        taux_occ: 1.5,
        taux_rlf: 1.5,
        montant_ddi_usd: 5540.57,
        montant_accise_usd: 0,
        montant_tva_usd: 5318.95,
        montant_fpi_usd: 554.06,
        montant_occ_usd: 415.54,
        montant_rlf_usd: 415.54,
        montant_autres_taxes_usd: 0,
        total_droits_taxes_usd: 12244.66
      },
      {
        id: 'm-2',
        designation: 'Téléviseurs Smart LED 43 pouces 4K',
        code_sh: '8528.72.00',
        quantite: 100,
        unite: 'Unité',
        prix_unitaire_usd: 110,
        valeur_fob_usd: 11000,
        fret_reparti_usd: 1508.57,
        assurance_repartie_usd: 188.57,
        autres_frais_usd: 0,
        valeur_caf_usd: 12697.14,
        valeur_caf_cdf: 36186849,
        poids_kg: 8000,
        pays_origine: 'Chine',
        taux_ddi: 20,
        taux_accise: 5,
        taux_tva: 16,
        taux_fpi: 2.0,
        taux_occ: 1.5,
        taux_rlf: 1.5,
        montant_ddi_usd: 2539.43,
        montant_accise_usd: 761.83,
        montant_tva_usd: 2559.74,
        montant_fpi_usd: 253.94,
        montant_occ_usd: 190.46,
        montant_rlf_usd: 190.46,
        montant_autres_taxes_usd: 0,
        total_droits_taxes_usd: 6495.86
      }
    ],
    total_ddi_usd: 8080.00,
    total_accises_usd: 761.83,
    total_tva_usd: 7878.69,
    total_fpi_usd: 808.00,
    total_occ_usd: 606.00,
    total_rlf_usd: 606.00,
    total_autres_redevances_usd: 50.00,
    total_droits_et_taxes_usd: 18790.52,
    total_droits_et_taxes_cdf: 53552982,
    frais_logistiques: DEFAULT_LOGISTIC_FEES_MATADI,
    total_frais_logistiques_usd: 1160.00,
    total_frais_logistiques_cdf: 3306000,
    cout_global_estime_usd: 19950.52,
    cout_global_estime_cdf: 56858982,
    observations: 'Simulation de conteneur d’appareils électroménagers pour approvisionnement de rentrée.'
  }
];

let simulations: SimulationDédouanement[] = loadData(SIMULATIONS_FILE, INITIAL_SIMULATIONS);
let tarifSH: CodeTarifaireSH[] = loadData(TARIF_FILE, OFFICIAL_TARIF_SH_2022);
let exchangeRates: ExchangeRateConfig[] = loadData(RATES_FILE, DEFAULT_EXCHANGE_RATES);
let taxRules: TaxRuleConfig[] = loadData(TAX_RULES_FILE, DEFAULT_TAX_RULES);
let exonerations: Exoneration[] = loadData(EXONERATIONS_FILE, DEFAULT_EXONERATIONS);
let auditLogs: AuditLog[] = loadData(AUDIT_LOGS_FILE, [
  {
    id: 'log-1',
    date: new Date().toISOString(),
    utilisateur: 'admin@douane.cd',
    role: 'Administrateur',
    action: 'INITIALISATION',
    entite: 'Base Tarifaire SH 2022 DGDA',
    nouvelle_valeur: 'Version initiale chargée'
  }
]);

// Helper for audit logging
function logAudit(utilisateur: string, role: string, action: string, entite: string, entite_id?: string, ancienne_valeur?: string, nouvelle_valeur?: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString(),
    utilisateur: utilisateur || 'Opérateur',
    role: role || 'Opérateur',
    action,
    entite,
    entite_id,
    ancienne_valeur,
    nouvelle_valeur
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 500) auditLogs = auditLogs.slice(0, 500);
  saveData(AUDIT_LOGS_FILE, auditLogs);
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// 1. Simulations
app.get('/api/simulations', (req, res) => {
  res.json({ simulations });
});

app.get('/api/simulations/:id', (req, res) => {
  const sim = simulations.find(s => s.id === req.params.id);
  if (!sim) {
    return res.status(404).json({ error: 'Simulation non trouvée' });
  }
  res.json({ simulation: sim });
});

app.post('/api/simulations', (req, res) => {
  try {
    const data = req.body;
    const count = simulations.length + 1;
    const refYear = new Date().getFullYear();
    const refNum = String(count).padStart(4, '0');
    const portCode = data.port_entree ? data.port_entree.substring(0, 3).toUpperCase() : 'MAT';

    const newSim: SimulationDédouanement = {
      ...data,
      id: data.id || `sim-${Date.now()}`,
      reference: data.reference || `SIM-${refYear}-${portCode}-${refNum}`,
      date_creation: data.date_creation || new Date().toISOString(),
      date_modification: new Date().toISOString(),
      statut: data.statut || 'simulation'
    };

    simulations.unshift(newSim);
    saveData(SIMULATIONS_FILE, simulations);

    logAudit('Opérateur Déclarant', 'Opérateur', 'CRÉATION_SIMULATION', 'Simulation', newSim.id, undefined, newSim.reference);

    res.status(201).json({ simulation: newSim });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la sauvegarde de la simulation' });
  }
});

app.put('/api/simulations/:id', (req, res) => {
  const index = simulations.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Simulation non trouvée' });
  }

  const oldSim = simulations[index];
  simulations[index] = {
    ...oldSim,
    ...req.body,
    date_modification: new Date().toISOString()
  };
  saveData(SIMULATIONS_FILE, simulations);

  logAudit('Opérateur Déclarant', 'Opérateur', 'MODIFICATION_SIMULATION', 'Simulation', oldSim.id, oldSim.statut, simulations[index].statut);

  res.json({ simulation: simulations[index] });
});

app.delete('/api/simulations/:id', (req, res) => {
  const index = simulations.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Simulation non trouvée' });
  }
  const deleted = simulations.splice(index, 1)[0];
  saveData(SIMULATIONS_FILE, simulations);

  logAudit('Opérateur Déclarant', 'Opérateur', 'SUPPRESSION_SIMULATION', 'Simulation', deleted.id, deleted.reference, undefined);

  res.json({ success: true, id: req.params.id });
});

// 2. Base Tarifaire SH 2022
app.get('/api/tarif', (req, res) => {
  const { query, chapitre, section } = req.query;
  let results = [...tarifSH];

  if (query && typeof query === 'string') {
    const q = query.toLowerCase().trim();
    results = results.filter(item => 
      item.code_sh.toLowerCase().includes(q) ||
      item.designation.toLowerCase().includes(q) ||
      item.chapitre.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q)
    );
  }

  if (chapitre && typeof chapitre === 'string') {
    results = results.filter(item => item.chapitre.includes(chapitre));
  }

  if (section && typeof section === 'string') {
    results = results.filter(item => item.section.includes(section));
  }

  res.json({
    total: results.length,
    version: 'SH 2022 - DGDA RDC',
    tarif: results
  });
});

app.post('/api/tarif', (req, res) => {
  try {
    const item: CodeTarifaireSH = req.body;
    if (!item.code_sh || !item.designation) {
      return res.status(400).json({ error: 'Code SH et Désignation obligatoires' });
    }

    // Check duplicate
    const exists = tarifSH.find(t => t.code_sh === item.code_sh);
    if (exists) {
      return res.status(400).json({ error: `Le code SH ${item.code_sh} existe déjà dans le tarif actif.` });
    }

    const newItem: CodeTarifaireSH = {
      ...item,
      id: item.id || `sh-${Date.now()}`,
      date_mise_a_jour: new Date().toISOString().split('T')[0],
      actif: item.actif !== undefined ? item.actif : true,
      version_tarif: item.version_tarif || 'SH 2022 v1.0'
    };

    tarifSH.unshift(newItem);
    saveData(TARIF_FILE, tarifSH);

    logAudit('Administrateur Tarif', 'Administrateur', 'AJOUT_CODE_SH', 'Tarif SH', newItem.id, undefined, `${newItem.code_sh} - ${newItem.designation}`);

    res.status(201).json({ item: newItem });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur ajout code SH' });
  }
});

app.put('/api/tarif/:id', (req, res) => {
  const index = tarifSH.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Code SH non trouvé' });
  }

  const oldItem = tarifSH[index];
  tarifSH[index] = {
    ...oldItem,
    ...req.body,
    date_mise_a_jour: new Date().toISOString().split('T')[0]
  };
  saveData(TARIF_FILE, tarifSH);

  logAudit('Administrateur Tarif', 'Administrateur', 'MODIFICATION_CODE_SH', 'Tarif SH', oldItem.id, `${oldItem.code_sh} (DDI: ${oldItem.taux_droit_douane}%)`, `${tarifSH[index].code_sh} (DDI: ${tarifSH[index].taux_droit_douane}%)`);

  res.json({ item: tarifSH[index] });
});

// Import bulk tariff (CSV or JSON)
app.post('/api/tarif/import', (req, res) => {
  try {
    const { items, nom_version } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Liste de codes tarifaires invalide' });
    }

    let addedCount = 0;
    let updatedCount = 0;

    items.forEach((it: any) => {
      const idx = tarifSH.findIndex(t => t.code_sh === it.code_sh);
      if (idx !== -1) {
        tarifSH[idx] = {
          ...tarifSH[idx],
          ...it,
          date_mise_a_jour: new Date().toISOString().split('T')[0]
        };
        updatedCount++;
      } else {
        tarifSH.push({
          id: `sh-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          code_sh: it.code_sh,
          designation: it.designation,
          section: it.section || 'Général',
          chapitre: it.chapitre || 'Divers',
          position: it.position || it.code_sh.substring(0, 5),
          sous_position: it.sous_position || it.code_sh.substring(0, 7),
          taux_droit_douane: Number(it.taux_droit_douane) || 10,
          taux_accise: Number(it.taux_accise) || 0,
          taux_tva: it.taux_tva !== undefined ? Number(it.taux_tva) : 16,
          unite_taxation: it.unite_taxation || 'kg',
          base_legale: it.base_legale || 'Tarif officiel DGDA SH 2022',
          version_tarif: nom_version || 'SH 2022 import',
          date_debut: it.date_debut || '2022-01-01',
          actif: true,
          date_mise_a_jour: new Date().toISOString().split('T')[0]
        });
        addedCount++;
      }
    });

    saveData(TARIF_FILE, tarifSH);
    logAudit('Administrateur Tarif', 'Administrateur', 'IMPORT_MASSE_TARIF', 'Tarif SH', nom_version, undefined, `${addedCount} ajoutés, ${updatedCount} mis à jour`);

    res.json({ success: true, addedCount, updatedCount, total: tarifSH.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de l’importation' });
  }
});

// 3. Taux de change
app.get('/api/rates', (req, res) => {
  res.json({ rates: exchangeRates });
});

app.post('/api/rates', (req, res) => {
  try {
    const { usd_to_cdf, eur_to_usd, eur_to_cdf, source } = req.body;
    if (!usd_to_cdf) {
      return res.status(400).json({ error: 'Taux USD/CDF obligatoire' });
    }

    // Set previous ones inactive
    exchangeRates.forEach(r => r.actif = false);

    const newRate: ExchangeRateConfig = {
      id: `rate-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      usd_to_cdf: Number(usd_to_cdf),
      eur_to_usd: Number(eur_to_usd) || 1.085,
      eur_to_cdf: Number(eur_to_cdf) || (Number(usd_to_cdf) * (Number(eur_to_usd) || 1.085)),
      source: source || 'Banque Centrale du Congo (BCC) / DGDA',
      actif: true
    };

    exchangeRates.unshift(newRate);
    saveData(RATES_FILE, exchangeRates);

    logAudit('Administrateur Change', 'Administrateur', 'MISE_A_JOUR_TAUX_CHANGE', 'Taux de change', newRate.id, undefined, `1 USD = ${newRate.usd_to_cdf} CDF`);

    res.status(201).json({ rate: newRate });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur mise à jour taux de change' });
  }
});

// 4. Règles fiscales & Exonérations
app.get('/api/tax-rules', (req, res) => {
  res.json({ rules: taxRules });
});

app.put('/api/tax-rules/:id', (req, res) => {
  const index = taxRules.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Règle non trouvée' });
  }
  const oldRule = taxRules[index];
  taxRules[index] = { ...oldRule, ...req.body };
  saveData(TAX_RULES_FILE, taxRules);

  logAudit('Administrateur Fiscal', 'Administrateur', 'MODIFICATION_REGLE_FISCALE', 'Tax Rules', oldRule.id, `${oldRule.tax_name} (${oldRule.default_rate}%)`, `${taxRules[index].tax_name} (${taxRules[index].default_rate}%)`);

  res.json({ rule: taxRules[index] });
});

app.get('/api/exonerations', (req, res) => {
  res.json({ exonerations });
});

app.post('/api/exonerations', (req, res) => {
  try {
    const exo: Exoneration = req.body;
    const newExo: Exoneration = {
      ...exo,
      id: exo.id || `exo-${Date.now()}`,
      actif: exo.actif !== undefined ? exo.actif : true
    };
    exonerations.unshift(newExo);
    saveData(EXONERATIONS_FILE, exonerations);
    logAudit('Administrateur Régimes', 'Administrateur', 'AJOUT_EXONERATION', 'Exonérations', newExo.id, undefined, newExo.titre);
    res.status(201).json({ exoneration: newExo });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Audit logs & Stats
app.get('/api/audit-logs', (req, res) => {
  res.json({ logs: auditLogs });
});

app.get('/api/stats', (req, res) => {
  const totalSimulations = simulations.length;
  const today = new Date().toISOString().split('T')[0];
  const simulationsDuJour = simulations.filter(s => s.date_creation.startsWith(today)).length;
  
  const valeurTotaleMarchandisesUSD = simulations.reduce((sum, s) => sum + (s.valeur_marchandise_fob_usd || 0), 0);
  const totalDroitsDouaneSimulesUSD = simulations.reduce((sum, s) => sum + (s.total_ddi_usd || 0), 0);
  const totalTaxesSimuleesUSD = simulations.reduce((sum, s) => sum + (s.total_droits_et_taxes_usd || 0), 0);
  const totalFraisLogistiquesUSD = simulations.reduce((sum, s) => sum + (s.total_frais_logistiques_usd || 0), 0);
  const conteneursEnCours = simulations.filter(s => s.statut === 'simulation' || s.statut === 'validee').length;

  res.json({
    totalSimulations,
    simulationsDuJour,
    valeurTotaleMarchandisesUSD,
    totalDroitsDouaneSimulesUSD,
    totalTaxesSimuleesUSD,
    totalFraisLogistiquesUSD,
    conteneursEnCours
  });
});

// ----------------------------------------------------
// GEMINI AI ASSISTANT ROUTES (Server-side @google/genai)
// ----------------------------------------------------

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// AI Classification Assistant (Grounded in DGDA official tariff)
app.post('/api/ai/classify', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description de la marchandise requise' });
    }

    // Build context of official DGDA tariff items
    const tariffSummary = tarifSH.map(t => ({
      code_sh: t.code_sh,
      designation: t.designation,
      taux_droit_douane: t.taux_droit_douane,
      taux_accise: t.taux_accise,
      taux_tva: t.taux_tva,
      unite: t.unite_taxation,
      chapitre: t.chapitre
    }));

    const ai = getGeminiClient();
    const systemPrompt = `Tu es l'Assistant Expert en Classification Douanière pour la République Démocratique du Congo (DGDA - Port de Matadi / SH 2022).
RÈGLE FONDAMENTALE ABSOLUE : Tu ne dois JAMAIS inventer un taux de douane ou un code SH.
Tu dois analyser la description fournie par l'utilisateur et rechercher parmi la base tarifaire officielle de la DGDA fournie ci-dessous les codes SH à 8 chiffres les plus pertinents.

BASE TARIFAIRE OFFICIELLE DGDA RDC DISPONIBLE:
${JSON.stringify(tariffSummary, null, 2)}

Pour chaque correspondance, explique pourquoi ce code SH correspond aux spécifications, quelles questions poser à l'importateur pour affiner le classement, et rappelle toujours que le classement définitif relève de la DGDA via un Renseignement Tarifaire Contraignant (RTC).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Description de la marchandise à importer : "${description}". Trouve les codes SH correspondants dans la base DGDA.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analyse: {
              type: Type.STRING,
              description: 'Analyse douanière synthétique des critères techniques de la marchandise'
            },
            recommandations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code_sh: { type: Type.STRING, description: 'Code SH 8 chiffres officiel DGDA' },
                  designation: { type: Type.STRING, description: 'Désignation officielle' },
                  taux_droit_douane: { type: Type.NUMBER, description: 'Taux DDI en %' },
                  taux_accise: { type: Type.NUMBER, description: 'Taux Droits d’accises en %' },
                  taux_tva: { type: Type.NUMBER, description: 'Taux TVA en %' },
                  pertinence_explication: { type: Type.STRING, description: 'Pourquoi ce code s’applique' },
                  questions_affinement: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Questions techniques (ex: puissance, état neuf/usagé, composition)'
                  }
                },
                required: ['code_sh', 'designation', 'taux_droit_douane', 'pertinence_explication']
              }
            },
            avertissement_rtc: {
              type: Type.STRING,
              description: 'Mention légale sur le Renseignement Tarifaire Contraignant DGDA'
            }
          },
          required: ['analyse', 'recommandations', 'avertissement_rtc']
        }
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini Classification Error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la classification IA' });
  }
});

// AI OCR Document Extractor (Commercial Invoice / BL / Packing list)
app.post('/api/ai/scan-document', async (req, res) => {
  try {
    const { image_base64, mime_type, text_content } = req.body;
    if (!image_base64 && !text_content) {
      return res.status(400).json({ error: 'Image ou texte du document requis pour le scan OCR' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `Tu es un système OCR douanier spécialisé dans l'extraction de factures commerciales maritimes, de connaissements (Bill of Lading / BL) et de listes de colisage (Packing List) pour les importations au Port de Matadi en RDC.
Extraie avec précision toutes les données clés :
- Nom et coordonnées de l'importateur
- Nom et pays du fournisseur
- Numéro et date de facture
- Incoterm (CIF, FOB, CFR, etc.)
- Numéro de BL et Numéro de Conteneur (ex: MSKU..., CMAU..., TGHU...)
- Port d'entrée (Matadi, Kinshasa, Boma)
- Poids brut et net
- Valeurs financières : FOB, Fret maritime, Assurance
- Lignes de marchandises : Désignation, Quantité, Unité, Prix unitaire, Poids, Code SH estimé si présent sur la facture.
Tout champ non trouvé doit être laissé vide ou à 0.`;

    let parts: any[] = [];
    if (image_base64) {
      // Clean base64 if it has data URL prefix
      const cleanBase64 = image_base64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mime_type || 'image/jpeg',
          data: cleanBase64
        }
      });
      parts.push({ text: "Extrais toutes les données douanières et commerciales de ce document d'importation." });
    } else {
      parts.push({ text: `Voici le texte brut du document commercial à analyser :\n\n${text_content}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type_document: { type: Type.STRING, description: 'Facture commerciale, Bill of Lading, Packing List' },
            importateur_nom: { type: Type.STRING },
            importateur_adresse: { type: Type.STRING },
            importateur_rccm: { type: Type.STRING },
            importateur_nif: { type: Type.STRING },
            fournisseur_nom: { type: Type.STRING },
            fournisseur_pays: { type: Type.STRING },
            numero_facture: { type: Type.STRING },
            date_facture: { type: Type.STRING },
            incoterm: { type: Type.STRING },
            devise_facturation: { type: Type.STRING },
            numero_bl: { type: Type.STRING },
            conteneur_numero: { type: Type.STRING },
            conteneur_type: { type: Type.STRING },
            nombre_colis: { type: Type.NUMBER },
            poids_brut_kg: { type: Type.NUMBER },
            poids_net_kg: { type: Type.NUMBER },
            port_entree: { type: Type.STRING },
            pays_origine: { type: Type.STRING },
            valeur_fob_usd: { type: Type.NUMBER },
            fret_usd: { type: Type.NUMBER },
            assurance_usd: { type: Type.NUMBER },
            marchandises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  designation: { type: Type.STRING },
                  code_sh_suggere: { type: Type.STRING },
                  quantite: { type: Type.NUMBER },
                  unite: { type: Type.STRING },
                  prix_unitaire_usd: { type: Type.NUMBER },
                  valeur_fob_usd: { type: Type.NUMBER },
                  poids_kg: { type: Type.NUMBER }
                },
                required: ['designation', 'quantite', 'prix_unitaire_usd']
              }
            },
            observations_ocr: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini OCR Error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l’analyse du document par IA' });
  }
});

// ----------------------------------------------------
// FRONTEND MIDDLEWARE (Vite in dev, Static in prod)
// ----------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DOUANE CALCUL RDC] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
