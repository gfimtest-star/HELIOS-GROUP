import { MarchandiseLigne, FraisLogistiqueItem, Exoneration, RegimeDouanier } from '../types/customs';

export interface CalculationResult {
  valeur_fob_totale_usd: number;
  fret_total_usd: number;
  assurance_totale_usd: number;
  autres_frais_total_usd: number;
  valeur_caf_totale_usd: number;
  valeur_caf_totale_cdf: number;
  
  marchandises_calculees: MarchandiseLigne[];
  
  total_ddi_usd: number;
  total_accises_usd: number;
  total_tva_usd: number;
  total_fpi_usd: number;
  total_occ_usd: number;
  total_rlf_usd: number;
  total_autres_redevances_usd: number;
  total_droits_et_taxes_usd: number;
  total_droits_et_taxes_cdf: number;
  
  frais_logistiques_calcules: FraisLogistiqueItem[];
  total_frais_logistiques_usd: number;
  total_frais_logistiques_cdf: number;
  
  cout_global_estime_usd: number;
  cout_global_estime_cdf: number;
  
  details_transparence: {
    etape: string;
    description: string;
    base_calcul_usd: number;
    base_calcul_cdf: number;
    taux_applique: string;
    formule: string;
    resultat_usd: number;
    resultat_cdf: number;
  }[];
}

export function calculerDedouanement(params: {
  marchandises: Partial<MarchandiseLigne>[];
  fret_global_usd: number;
  assurance_globale_usd: number;
  autres_frais_evaluation_usd: number;
  taux_change_usd_cdf: number;
  regime_douanier: RegimeDouanier;
  exoneration?: Exoneration | null;
  frais_logistiques: FraisLogistiqueItem[];
}): CalculationResult {
  const {
    marchandises,
    fret_global_usd = 0,
    assurance_globale_usd = 0,
    autres_frais_evaluation_usd = 0,
    taux_change_usd_cdf = 2850,
    regime_douanier = 'mise_a_la_consommation',
    exoneration,
    frais_logistiques = []
  } = params;

  // 1. Calcul de la valeur FOB totale
  let valeur_fob_totale_usd = 0;
  marchandises.forEach(m => {
    const qte = Number(m.quantite) || 0;
    const pu = Number(m.prix_unitaire_usd) || 0;
    const fob = m.valeur_fob_usd !== undefined && m.valeur_fob_usd > 0 ? Number(m.valeur_fob_usd) : qte * pu;
    valeur_fob_totale_usd += fob;
  });

  const valeur_caf_totale_usd = valeur_fob_totale_usd + fret_global_usd + assurance_globale_usd + autres_frais_evaluation_usd;
  const valeur_caf_totale_cdf = valeur_caf_totale_usd * taux_change_usd_cdf;

  // Exoneration modifiers
  let facteur_exo_ddi = 1;
  let facteur_exo_accise = 1;
  let facteur_exo_tva = 1;

  if (exoneration && exoneration.actif) {
    facteur_exo_ddi = Math.max(0, 1 - (Number(exoneration.taux_exoneration_ddi) || 0) / 100);
    facteur_exo_accise = Math.max(0, 1 - (Number(exoneration.taux_exoneration_accises) || 0) / 100);
    facteur_exo_tva = Math.max(0, 1 - (Number(exoneration.taux_exoneration_tva) || 0) / 100);
  }

  // Regime Douanier impacts
  // Si transit ou entrepôt douanier : suspension totale des droits et taxes
  let facteur_regime = 1;
  if (regime_douanier === 'entrepot_douanier' || regime_douanier === 'transit') {
    facteur_regime = 0; // Suspension des droits à l'entrée
  } else if (regime_douanier === 'importation_temporaire') {
    facteur_regime = 0.1; // Régime suspensif avec redevance administrative
  }

  let total_ddi_usd = 0;
  let total_accises_usd = 0;
  let total_tva_usd = 0;
  let total_fpi_usd = 0;
  let total_occ_usd = 0;
  let total_rlf_usd = 0;

  // 2. Répartition du fret et de l'assurance au prorata de la valeur FOB
  const marchandises_calculees: MarchandiseLigne[] = marchandises.map((m, index) => {
    const quantite = Number(m.quantite) || 0;
    const prix_unitaire_usd = Number(m.prix_unitaire_usd) || 0;
    const valeur_fob_usd = (m.valeur_fob_usd && m.valeur_fob_usd > 0) ? Number(m.valeur_fob_usd) : (quantite * prix_unitaire_usd);
    
    // Quote-part
    const ratio_fob = valeur_fob_totale_usd > 0 ? (valeur_fob_usd / valeur_fob_totale_usd) : (1 / (marchandises.length || 1));
    const fret_reparti_usd = m.fret_reparti_usd !== undefined ? Number(m.fret_reparti_usd) : (fret_global_usd * ratio_fob);
    const assurance_repartie_usd = m.assurance_repartie_usd !== undefined ? Number(m.assurance_repartie_usd) : (assurance_globale_usd * ratio_fob);
    const autres_frais_usd = m.autres_frais_usd !== undefined ? Number(m.autres_frais_usd) : (autres_frais_evaluation_usd * ratio_fob);
    
    const valeur_caf_usd = valeur_fob_usd + fret_reparti_usd + assurance_repartie_usd + autres_frais_usd;
    const valeur_caf_cdf = valeur_caf_usd * taux_change_usd_cdf;

    const taux_ddi = Number(m.taux_ddi) || 0;
    const taux_accise = Number(m.taux_accise) || 0;
    const taux_tva = Number(m.taux_tva) !== undefined ? Number(m.taux_tva) : 16;
    const taux_fpi = Number(m.taux_fpi) !== undefined ? Number(m.taux_fpi) : 2.0;
    const taux_occ = Number(m.taux_occ) !== undefined ? Number(m.taux_occ) : 1.5;
    const taux_rlf = Number(m.taux_rlf) !== undefined ? Number(m.taux_rlf) : 1.5;

    // FORMULES RDC:
    // Base DDI = CAF
    const base_ddi = valeur_caf_usd;
    const montant_ddi_usd = base_ddi * (taux_ddi / 100) * facteur_exo_ddi * facteur_regime;

    // Base Accises = CAF + DDI
    const base_accise = valeur_caf_usd + montant_ddi_usd;
    const montant_accise_usd = base_accise * (taux_accise / 100) * facteur_exo_accise * facteur_regime;

    // Base TVA = CAF + DDI + Accises
    const base_tva = valeur_caf_usd + montant_ddi_usd + montant_accise_usd;
    const montant_tva_usd = base_tva * (taux_tva / 100) * facteur_exo_tva * facteur_regime;

    // Redevances et prélèvements
    const base_fpi = valeur_caf_usd;
    const montant_fpi_usd = base_fpi * (taux_fpi / 100) * facteur_regime;

    const base_occ = valeur_caf_usd;
    const montant_occ_usd = base_occ * (taux_occ / 100) * facteur_regime;

    const base_rlf = valeur_caf_usd;
    const montant_rlf_usd = base_rlf * (taux_rlf / 100) * facteur_regime;

    const montant_autres_taxes_usd = 0;
    const total_droits_taxes_usd = montant_ddi_usd + montant_accise_usd + montant_tva_usd + montant_fpi_usd + montant_occ_usd + montant_rlf_usd + montant_autres_taxes_usd;

    total_ddi_usd += montant_ddi_usd;
    total_accises_usd += montant_accise_usd;
    total_tva_usd += montant_tva_usd;
    total_fpi_usd += montant_fpi_usd;
    total_occ_usd += montant_occ_usd;
    total_rlf_usd += montant_rlf_usd;

    return {
      id: m.id || `marchandise-${index + 1}`,
      designation: m.designation || `Marchandise #${index + 1}`,
      code_sh: m.code_sh || '0000.00.00',
      sh_id: m.sh_id,
      quantite,
      unite: m.unite || 'Unité',
      prix_unitaire_usd,
      valeur_fob_usd,
      fret_reparti_usd,
      assurance_repartie_usd,
      autres_frais_usd,
      valeur_caf_usd,
      valeur_caf_cdf,
      poids_kg: Number(m.poids_kg) || 0,
      pays_origine: m.pays_origine || 'Chine',
      taux_ddi,
      taux_accise,
      taux_tva,
      taux_fpi,
      taux_occ,
      taux_rlf,
      montant_ddi_usd,
      montant_accise_usd,
      montant_tva_usd,
      montant_fpi_usd,
      montant_occ_usd,
      montant_rlf_usd,
      montant_autres_taxes_usd,
      total_droits_taxes_usd,
      calcul_detail: {
        base_ddi,
        base_accise,
        base_tva,
        base_fpi,
        base_occ,
        base_rlf,
        formule_ddi: `${base_ddi.toFixed(2)} $ × ${taux_ddi}% = ${montant_ddi_usd.toFixed(2)} $`,
        formule_accise: `${base_accise.toFixed(2)} $ × ${taux_accise}% = ${montant_accise_usd.toFixed(2)} $`,
        formule_tva: `(${valeur_caf_usd.toFixed(2)} + ${montant_ddi_usd.toFixed(2)} + ${montant_accise_usd.toFixed(2)}) $ × ${taux_tva}% = ${montant_tva_usd.toFixed(2)} $`
      }
    };
  });

  // Frais administratifs DGDA fixes (DGRAD / Sydonia)
  const total_autres_redevances_usd = 50.0 * (facteur_regime === 0 ? 0.2 : 1);

  const total_droits_et_taxes_usd = total_ddi_usd + total_accises_usd + total_tva_usd + total_fpi_usd + total_occ_usd + total_rlf_usd + total_autres_redevances_usd;
  const total_droits_et_taxes_cdf = total_droits_et_taxes_usd * taux_change_usd_cdf;

  // 3. Frais logistiques
  const frais_logistiques_calcules: FraisLogistiqueItem[] = frais_logistiques.map(f => ({
    ...f,
    montant_cdf: (Number(f.montant_usd) || 0) * taux_change_usd_cdf
  }));

  const total_frais_logistiques_usd = frais_logistiques_calcules
    .filter(f => f.actif)
    .reduce((sum, f) => sum + (Number(f.montant_usd) || 0), 0);
  const total_frais_logistiques_cdf = total_frais_logistiques_usd * taux_change_usd_cdf;

  // 4. Coût global estimatif
  const cout_global_estime_usd = total_droits_et_taxes_usd + total_frais_logistiques_usd;
  const cout_global_estime_cdf = cout_global_estime_usd * taux_change_usd_cdf;

  // 5. Journal de transparence mathématique
  const details_transparence = [
    {
      etape: '1. Valeur en Douane (CAF)',
      description: 'Somme de la valeur FOB des marchandises + Fret maritime + Assurance + Frais d’évaluation',
      base_calcul_usd: valeur_fob_totale_usd,
      base_calcul_cdf: valeur_fob_totale_usd * taux_change_usd_cdf,
      taux_applique: 'Incoterm CIF / CAF',
      formule: `FOB (${valeur_fob_totale_usd.toFixed(2)} $) + Fret (${fret_global_usd.toFixed(2)} $) + Assurance (${assurance_globale_usd.toFixed(2)} $) = ${valeur_caf_totale_usd.toFixed(2)} $`,
      resultat_usd: valeur_caf_totale_usd,
      resultat_cdf: valeur_caf_totale_cdf
    },
    {
      etape: '2. Droit de Douane à l’Importation (DDI)',
      description: 'Application des taux officiels SH 2022 par ligne tarifaire sur la valeur CAF',
      base_calcul_usd: valeur_caf_totale_usd,
      base_calcul_cdf: valeur_caf_totale_cdf,
      taux_applique: 'Taux SH (0%, 5%, 10%, 20%)',
      formule: `Somme(CAF_ligne × Taux_DDI_ligne)`,
      resultat_usd: total_ddi_usd,
      resultat_cdf: total_ddi_usd * taux_change_usd_cdf
    },
    {
      etape: '3. Droits d’Accises (DA)',
      description: 'Taxation spécifique applicable aux produits assujettis (boissons, véhicules, tabacs, luxe)',
      base_calcul_usd: valeur_caf_totale_usd + total_ddi_usd,
      base_calcul_cdf: (valeur_caf_totale_usd + total_ddi_usd) * taux_change_usd_cdf,
      taux_applique: 'Code des Accises (0% à 50%)',
      formule: `(CAF + DDI) × Taux_Accise`,
      resultat_usd: total_accises_usd,
      resultat_cdf: total_accises_usd * taux_change_usd_cdf
    },
    {
      etape: '4. Taxe sur la Valeur Ajoutée (TVA - 16%)',
      description: 'TVA légale en RDC assise sur l’assiette cumulée (CAF + DDI + Droits d’Accises)',
      base_calcul_usd: valeur_caf_totale_usd + total_ddi_usd + total_accises_usd,
      base_calcul_cdf: (valeur_caf_totale_usd + total_ddi_usd + total_accises_usd) * taux_change_usd_cdf,
      taux_applique: '16.0 %',
      formule: `(${valeur_caf_totale_usd.toFixed(2)} + ${total_ddi_usd.toFixed(2)} + ${total_accises_usd.toFixed(2)}) $ × 16%`,
      resultat_usd: total_tva_usd,
      resultat_cdf: total_tva_usd * taux_change_usd_cdf
    },
    {
      etape: '5. Redevances & Taxes Connexes (FPI, OCC, RLF, DGRAD)',
      description: 'FPI (2%) + OCC (1.5%) + RLF/OGEFREM (1.5%) + Timbre et Sydonia World ($50)',
      base_calcul_usd: valeur_caf_totale_usd,
      base_calcul_cdf: valeur_caf_totale_cdf,
      taux_applique: '2.0% + 1.5% + 1.5% + Forfait',
      formule: `FPI (${total_fpi_usd.toFixed(2)} $) + OCC (${total_occ_usd.toFixed(2)} $) + RLF (${total_rlf_usd.toFixed(2)} $) + DGRAD (${total_autres_redevances_usd.toFixed(2)} $)`,
      resultat_usd: total_fpi_usd + total_occ_usd + total_rlf_usd + total_autres_redevances_usd,
      resultat_cdf: (total_fpi_usd + total_occ_usd + total_rlf_usd + total_autres_redevances_usd) * taux_change_usd_cdf
    },
    {
      etape: '6. Frais Logistiques et Portuaires (Port de Matadi)',
      description: 'Manutention SCTP/MGT, Scanning obligatoire, Magasinage, Honoraires Déclarant CAD, etc.',
      base_calcul_usd: total_frais_logistiques_usd,
      base_calcul_cdf: total_frais_logistiques_cdf,
      taux_applique: 'Tarif Prestataires Portuaires',
      formule: `Total des postes logistiques activés`,
      resultat_usd: total_frais_logistiques_usd,
      resultat_cdf: total_frais_logistiques_cdf
    }
  ];

  return {
    valeur_fob_totale_usd,
    fret_total_usd: fret_global_usd,
    assurance_totale_usd: assurance_globale_usd,
    autres_frais_total_usd: autres_frais_evaluation_usd,
    valeur_caf_totale_usd,
    valeur_caf_totale_cdf,
    marchandises_calculees,
    total_ddi_usd,
    total_accises_usd,
    total_tva_usd,
    total_fpi_usd,
    total_occ_usd,
    total_rlf_usd,
    total_autres_redevances_usd,
    total_droits_et_taxes_usd,
    total_droits_et_taxes_cdf,
    frais_logistiques_calcules,
    total_frais_logistiques_usd,
    total_frais_logistiques_cdf,
    cout_global_estime_usd,
    cout_global_estime_cdf,
    details_transparence
  };
}

export function formatCurrencyUSD(val: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
}

export function formatCurrencyCDF(val: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
}
