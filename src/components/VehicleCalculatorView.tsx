import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Truck, 
  Bus, 
  Calendar, 
  HelpCircle, 
  FileText, 
  Calculator, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Coins, 
  Download, 
  PlusCircle, 
  Info,
  Ship
} from 'lucide-react';
import { ExchangeRateConfig, SimulationDédouanement, PortEntree } from '../types/customs';

interface VehicleCalculatorViewProps {
  currentRate: ExchangeRateConfig;
  onImportToSimulation?: (simulationData: Partial<SimulationDédouanement>) => void;
}

type VehicleCategory = 'tourisme' | 'suv_4x4' | 'pickup_utilitaire' | 'minibus' | 'bus_grand' | 'camion_porteur' | 'tracteur_routier' | 'moto';
type FuelType = 'essence' | 'diesel' | 'hybride_electrique';

interface VehiclePreset {
  category: VehicleCategory;
  label: string;
  code_sh: string;
  taux_ddi: number;
  baseAcciseEssence: number;
  baseAcciseDiesel: number;
  valeurFobRefNeuf: number;
  fretMoyenRoRo: number;
}

const VEHICLE_PRESETS: Record<VehicleCategory, VehiclePreset> = {
  tourisme: {
    category: 'tourisme',
    label: 'Voiture Berline / Citadine (Tourisme)',
    code_sh: '8703.22.90',
    taux_ddi: 20, // 20% DDI pour véhicules de tourisme
    baseAcciseEssence: 10,
    baseAcciseDiesel: 10,
    valeurFobRefNeuf: 14000,
    fretMoyenRoRo: 1650
  },
  suv_4x4: {
    category: 'suv_4x4',
    label: 'SUV / 4x4 / Tout-terrain (> 2000 cm³)',
    code_sh: '8703.23.90',
    taux_ddi: 20,
    baseAcciseEssence: 15,
    baseAcciseDiesel: 15,
    valeurFobRefNeuf: 24000,
    fretMoyenRoRo: 1950
  },
  pickup_utilitaire: {
    category: 'pickup_utilitaire',
    label: 'Pick-up / Camionnette Utilitaire (≤ 5T)',
    code_sh: '8704.21.90',
    taux_ddi: 10, // DDI réduit 10% pour utilitaires de transport de marchandises
    baseAcciseEssence: 5,
    baseAcciseDiesel: 5,
    valeurFobRefNeuf: 18000,
    fretMoyenRoRo: 1850
  },
  minibus: {
    category: 'minibus',
    label: 'Minibus de transport en commun (10 à 15 places)',
    code_sh: '8702.10.90',
    taux_ddi: 10,
    baseAcciseEssence: 5,
    baseAcciseDiesel: 5,
    valeurFobRefNeuf: 16000,
    fretMoyenRoRo: 2200
  },
  bus_grand: {
    category: 'bus_grand',
    label: 'Autobus / Autocar grand format (> 30 places)',
    code_sh: '8702.90.90',
    taux_ddi: 5, // DDI incitatif 5% pour grands transports en commun
    baseAcciseEssence: 0,
    baseAcciseDiesel: 0,
    valeurFobRefNeuf: 45000,
    fretMoyenRoRo: 4500
  },
  camion_porteur: {
    category: 'camion_porteur',
    label: 'Camion Poids Lourd Benne / Plateau (> 5T)',
    code_sh: '8704.22.90',
    taux_ddi: 10,
    baseAcciseEssence: 0,
    baseAcciseDiesel: 0,
    valeurFobRefNeuf: 38000,
    fretMoyenRoRo: 3900
  },
  tracteur_routier: {
    category: 'tracteur_routier',
    label: 'Tracteur Routier pour semi-remorques',
    code_sh: '8701.20.90',
    taux_ddi: 5, // DDI réduit équipement lourd
    baseAcciseEssence: 0,
    baseAcciseDiesel: 0,
    valeurFobRefNeuf: 32000,
    fretMoyenRoRo: 3500
  },
  moto: {
    category: 'moto',
    label: 'Motocyclette / Scooter (≤ 250 cm³)',
    code_sh: '8711.20.90',
    taux_ddi: 20,
    baseAcciseEssence: 10,
    baseAcciseDiesel: 10,
    valeurFobRefNeuf: 1500,
    fretMoyenRoRo: 450
  }
};

export const VehicleCalculatorView: React.FC<VehicleCalculatorViewProps> = ({
  currentRate,
  onImportToSimulation
}) => {
  // Vehicle specs
  const [category, setCategory] = useState<VehicleCategory>('suv_4x4');
  const [marque, setMarque] = useState<string>('Toyota');
  const [modele, setModele] = useState<string>('Prado TXL');
  const [anneeFabrication, setAnneeFabrication] = useState<number>(2017);
  const [cylindreeCm3, setCylindreeCm3] = useState<number>(2700);
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [modeTransport, setModeTransport] = useState<'roro' | 'conteneurise'>('roro');
  const [portArrivee, setPortArrivee] = useState<PortEntree>('matadi');

  // Financial inputs
  const currentYear = 2026;
  const ageVehicule = Math.max(0, currentYear - anneeFabrication);

  const preset = VEHICLE_PRESETS[category];

  // Argus DGDA depreciation grid
  // In DRC customs valuation practice, depreciation applies to the reference new value:
  // 1 yr: 85%, 2 yrs: 70%, 3 yrs: 60%, 4 yrs: 50%, 5 yrs: 45%, 6-10 yrs: 40%, >10 yrs: 35% minimum
  const coefficientArgus = useMemo(() => {
    if (ageVehicule === 0) return 1.0;
    if (ageVehicule === 1) return 0.85;
    if (ageVehicule === 2) return 0.70;
    if (ageVehicule === 3) return 0.60;
    if (ageVehicule === 4) return 0.50;
    if (ageVehicule <= 7) return 0.45;
    if (ageVehicule <= 10) return 0.40;
    return 0.35; // Plancher de valeur résiduelle taxable
  }, [ageVehicule]);

  const [valeurAchatReelleUSD, setValeurAchatReelleUSD] = useState<number>(12500);
  const [fretUSD, setFretUSD] = useState<number>(preset.fretMoyenRoRo);
  const [assuranceUSD, setAssuranceUSD] = useState<number>(150);

  // Valeur d'évaluation en douane : la DGDA applique la valeur la plus élevée entre la valeur déclarée et la valeur Argus résiduelle
  const valeurArgusCalculee = Math.round(preset.valeurFobRefNeuf * coefficientArgus);
  const valeurFobRetenue = Math.max(valeurAchatReelleUSD, valeurArgusCalculee);

  // Calcul CAF (CIF)
  const valeurCAF_USD = valeurFobRetenue + fretUSD + assuranceUSD;
  const valeurCAF_CDF = valeurCAF_USD * currentRate.usd_to_cdf;

  // Taux d'accises spécifique selon cylindrée et motorisation
  const tauxAcciseApplique = useMemo(() => {
    if (fuelType === 'hybride_electrique') return 0; // Incitation fiscale
    if (category === 'tourisme' || category === 'suv_4x4') {
      if (cylindreeCm3 > 3000) return 20; // Véhicule de luxe / forte cylindrée
      if (cylindreeCm3 > 2000) return 15;
      return 10;
    }
    return preset.baseAcciseEssence;
  }, [category, cylindreeCm3, fuelType, preset.baseAcciseEssence]);

  // Décompte des taxes
  // 1. DDI = CAF * Taux DDI
  const montantDDI_USD = valeurCAF_USD * (preset.taux_ddi / 100);
  // 2. Accises = (CAF + DDI) * Taux Accise
  const assietteAccises_USD = valeurCAF_USD + montantDDI_USD;
  const montantAccises_USD = assietteAccises_USD * (tauxAcciseApplique / 100);
  // 3. TVA 16% = (CAF + DDI + Accises) * 16%
  const assietteTVA_USD = valeurCAF_USD + montantDDI_USD + montantAccises_USD;
  const montantTVA_USD = assietteTVA_USD * 0.16;
  // 4. RLF OGEFREM 1.5% sur CAF
  const montantRLF_USD = valeurCAF_USD * 0.015;
  // 5. FPI 2.0% sur CAF
  const montantFPI_USD = valeurCAF_USD * 0.02;
  // 6. OCC 1.5% sur CAF
  const montantOCC_USD = valeurCAF_USD * 0.015;
  // 7. Frais Sydonia & Timbre
  const montantSydonia_USD = 85;

  // Total Droits & Taxes DGDA
  const totalTaxesDouane_USD = montantDDI_USD + montantAccises_USD + montantTVA_USD + montantRLF_USD + montantFPI_USD + montantOCC_USD + montantSydonia_USD;
  const totalTaxesDouane_CDF = totalTaxesDouane_USD * currentRate.usd_to_cdf;

  // Frais Portuaires & Déchargement (Matadi/Boma)
  const fraisPortuairesEstimes_USD = useMemo(() => {
    if (category === 'moto') return 120;
    if (category === 'camion_porteur' || category === 'tracteur_routier' || category === 'bus_grand') return 950;
    return modeTransport === 'roro' ? 450 : 650; // Acconage véhicule léger + passage portuaire
  }, [category, modeTransport]);

  const totalGlobalPredecharge_USD = totalTaxesDouane_USD + fraisPortuairesEstimes_USD;
  const totalGlobalPredecharge_CDF = totalGlobalPredecharge_USD * currentRate.usd_to_cdf;

  // Alertes réglementaires (Décret RDC interdisant l'importation de véhicules de plus de 10 ans pour le transport de personnes ou 20 ans pour les utilitaires)
  const isAgeRestrictionAlert = ageVehicule > 10 && (category === 'tourisme' || category === 'suv_4x4' || category === 'minibus');
  const isUtilityAgeAlert = ageVehicule > 20 && (category === 'pickup_utilitaire' || category === 'camion_porteur' || category === 'tracteur_routier');

  // Handle Preset change
  const handleCategoryChange = (newCat: VehicleCategory) => {
    setCategory(newCat);
    const p = VEHICLE_PRESETS[newCat];
    setFretUSD(p.fretMoyenRoRo);
  };

  const handleExportToSimulation = () => {
    if (!onImportToSimulation) return;
    const simData: Partial<SimulationDédouanement> = {
      reference: `SIM-${new Date().getFullYear()}-VEH-${Math.floor(1000 + Math.random() * 9000)}`,
      conteneur_numero: `${marque.toUpperCase()} ${modele} (${anneeFabrication})`,
      port_entree: portArrivee,
      taux_change_usd_cdf: currentRate.usd_to_cdf,
      regime_douanier: 'mise_a_la_consommation',
      conteneur_type: modeTransport === 'roro' ? 'vrac_conventionnel' : '20_pieds',
      valeur_marchandise_fob_usd: valeurFobRetenue,
      fret_usd: fretUSD,
      assurance_usd: assuranceUSD,
      valeur_caf_globale_usd: valeurCAF_USD,
      valeur_caf_globale_cdf: valeurCAF_CDF,
      marchandises: [
        {
          id: `veh-${Date.now()}`,
          designation: `Véhicule ${marque} ${modele} - Année ${anneeFabrication} - ${cylindreeCm3} cm³ (${fuelType})`,
          code_sh: preset.code_sh,
          quantite: 1,
          unite: 'U',
          prix_unitaire_usd: valeurFobRetenue,
          valeur_fob_usd: valeurFobRetenue,
          fret_reparti_usd: fretUSD,
          assurance_repartie_usd: assuranceUSD,
          autres_frais_usd: 0,
          valeur_caf_usd: valeurCAF_USD,
          valeur_caf_cdf: valeurCAF_CDF,
          poids_kg: 1850,
          pays_origine: 'Japon / UE / USA',
          taux_ddi: preset.taux_ddi,
          taux_accise: tauxAcciseApplique,
          taux_tva: 16,
          taux_fpi: 2.0,
          taux_occ: 1.5,
          taux_rlf: 1.5,
          montant_ddi_usd: montantDDI_USD,
          montant_accise_usd: montantAccises_USD,
          montant_tva_usd: montantTVA_USD,
          montant_fpi_usd: montantFPI_USD,
          montant_occ_usd: montantOCC_USD,
          montant_rlf_usd: montantRLF_USD,
          montant_autres_taxes_usd: 0,
          total_droits_taxes_usd: totalTaxesDouane_USD - montantSydonia_USD
        }
      ]
    };
    onImportToSimulation(simData);
  };

  return (
    <div id="vehicle-calculator-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Simulateur Véhicules d'Occasion & Engins</h1>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Barème Argus DGDA RDC
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Calcul officiel de dédouanement avec décote d'âge, droits d'accises selon la cylindrée et frais de débarquement Ro-Ro (Matadi / Boma).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <Coins className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <div className="text-slate-400">Taux Douane Hebdo :</div>
              <div className="font-bold text-emerald-300">1 USD = {currentRate.usd_to_cdf.toLocaleString('fr-FR')} CDF</div>
            </div>
          </div>
        </div>
      </div>

      {/* Age Restriction Alert if applicable */}
      {(isAgeRestrictionAlert || isUtilityAgeAlert) && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-rose-300">Avertissement Réglementaire DGDA - Âge Limite du Véhicule :</div>
            <p>
              Le Décret n° 12/041 portant interdiction d'importation des véhicules d'occasion de plus de <strong>10 ans</strong> (pour les véhicules de tourisme / transport en commun) ou <strong>20 ans</strong> (pour les utilitaires / poids lourds) s'applique en RDC. Ce véhicule ({ageVehicule} ans) nécessite une dérogation ministérielle préalable ou sera soumis à des pénalités spéciales au port d'entrée.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout: Input Parameters + Results Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Vehicle Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Car className="w-4 h-4 text-blue-400" />
              <span>1. Caractéristiques & Catégorie du Véhicule</span>
            </h2>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Catégorie & Type de Carrosserie
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(VEHICLE_PRESETS) as VehicleCategory[]).map((catKey) => {
                  const p = VEHICLE_PRESETS[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => handleCategoryChange(catKey)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-600/20 border-blue-500 text-white font-medium' 
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold line-clamp-1">{p.label.split('(')[0]}</span>
                      <span className="text-[10px] text-slate-400 mt-1">DDI: {p.taux_ddi}% • SH {p.code_sh}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marque & Modele */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marque</label>
                <input
                  type="text"
                  value={marque}
                  onChange={(e) => setMarque(e.target.value)}
                  placeholder="ex: Toyota, Mercedes, Scania"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Modèle & Finition</label>
                <input
                  type="text"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                  placeholder="ex: Prado TXL, Hilux, Actros"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Annee, Cylindree, Carburant */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Année de Fabrication ({ageVehicule} ans)
                </label>
                <select
                  value={anneeFabrication}
                  onChange={(e) => setAnneeFabrication(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {Array.from({ length: 25 }, (_, i) => currentYear - i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} ({currentYear - yr} ans)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cylindrée Moteur (cm³)
                </label>
                <input
                  type="number"
                  value={cylindreeCm3}
                  onChange={(e) => setCylindreeCm3(Math.max(50, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motorisation</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="diesel">Diesel (Gazole)</option>
                  <option value="essence">Essence</option>
                  <option value="hybride_electrique">Hybride / Électrique (0% Accises)</option>
                </select>
              </div>
            </div>

            {/* Mode Transport & Port */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mode d'Expédition Maritime</label>
                <select
                  value={modeTransport}
                  onChange={(e) => setModeTransport(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="roro">Navire Roulier (Ro-Ro) - Conventionnel</option>
                  <option value="conteneurise">Empoté en Conteneur (FCL / LCL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Port d'Entrée RDC</label>
                <select
                  value={portArrivee}
                  onChange={(e) => setPortArrivee(e.target.value as PortEntree)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="matadi">Port de Matadi (Principal)</option>
                  <option value="boma">Port de Boma (Spécialisé Véhicules)</option>
                  <option value="kinshasa">Kinshasa (Port fluvial / Aéro)</option>
                  <option value="kasumbalesa">Poste Frontalier Kasumbalesa (Routier)</option>
                </select>
              </div>
            </div>

            {/* 2. Financial Elements */}
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-t border-slate-800 pt-4 pb-1">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>2. Valeurs Financières & Facture (USD)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Prix d'Achat Facture FOB ($)
                </label>
                <input
                  type="number"
                  value={valeurAchatReelleUSD}
                  onChange={(e) => setValeurAchatReelleUSD(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fret Maritime Ro-Ro / FCL ($)
                </label>
                <input
                  type="number"
                  value={fretUSD}
                  onChange={(e) => setFretUSD(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assurance Maritime ($)
                </label>
                <input
                  type="number"
                  value={assuranceUSD}
                  onChange={(e) => setAssuranceUSD(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Argus Explanation Box */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-slate-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" />
                  Contrôle de Valeur Argus DGDA :
                </span>
                <span className="text-emerald-400 font-bold">
                  {valeurArgusCalculee.toLocaleString('fr-FR')} $ (Décote {(100 - coefficientArgus * 100).toFixed(0)}%)
                </span>
              </div>
              <p className="text-slate-400">
                La valeur FOB retenue par la douane est de <strong>{valeurFobRetenue.toLocaleString('fr-FR')} $</strong> {valeurAchatReelleUSD >= valeurArgusCalculee ? '(facture acceptée)' : '(redressement sur la valeur minimale Argus de référence)'}.
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Calculations & Tax Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Décompte Fiscal & Portuaire</h2>
              <span className="text-xs bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded">
                SH {preset.code_sh}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <div className="text-[11px] text-slate-400">Assiette Douanière CAF</div>
                <div className="text-base font-bold text-white mt-0.5">{valeurCAF_USD.toLocaleString('fr-FR')} $</div>
                <div className="text-[10px] text-slate-400">{valeurCAF_CDF.toLocaleString('fr-FR')} CDF</div>
              </div>
              <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-800/60">
                <div className="text-[11px] text-blue-300">Total Taxes DGDA</div>
                <div className="text-base font-bold text-blue-200 mt-0.5">{totalTaxesDouane_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</div>
                <div className="text-[10px] text-blue-300/80">{totalTaxesDouane_CDF.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF</div>
              </div>
            </div>

            {/* Taxes breakdown list */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">DDI (Droit de Douane - {preset.taux_ddi}%) :</span>
                <span className="font-semibold text-white font-mono">{montantDDI_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Droits d'Accises ({tauxAcciseApplique}%) :</span>
                <span className="font-semibold text-amber-300 font-mono">{montantAccises_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">TVA (16.0% sur CAF+DDI+Accises) :</span>
                <span className="font-semibold text-white font-mono">{montantTVA_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Redevance RLF OGEFREM (1.5%) :</span>
                <span className="font-semibold text-slate-300 font-mono">{montantRLF_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Taxe FPI (2.0%) :</span>
                <span className="font-semibold text-slate-300 font-mono">{montantFPI_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Redevance OCC (1.5%) :</span>
                <span className="font-semibold text-slate-300 font-mono">{montantOCC_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300">Frais Sydonia & Timbres DGRAD :</span>
                <span className="font-semibold text-slate-300 font-mono">{montantSydonia_USD.toLocaleString('fr-FR')} $</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-cyan-300">
                <span className="flex items-center gap-1">
                  <Ship className="w-3.5 h-3.5" />
                  Acconage & Passage Portuaire (Est.) :
                </span>
                <span className="font-semibold font-mono">{fraisPortuairesEstimes_USD.toLocaleString('fr-FR')} $</span>
              </div>
            </div>

            {/* Grand Total Highlight */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/60 rounded-xl p-4 text-center">
              <div className="text-xs text-emerald-300 font-medium">BUDGET TOTAL ESTIMÉ (Taxes + Port)</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {totalGlobalPredecharge_USD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                ≈ {totalGlobalPredecharge_CDF.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Pression fiscale globale : {((totalTaxesDouane_USD / valeurCAF_USD) * 100).toFixed(1)}% de la valeur CAF
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {onImportToSimulation && (
                <button
                  type="button"
                  onClick={handleExportToSimulation}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Transférer vers le Dossier de Simulation Complet</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
