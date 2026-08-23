export type ContainerType = '20_pieds' | '40_pieds' | '40_pieds_hc' | 'autre' | 'vrac_conventionnel';

export type PortEntree = 'matadi' | 'boma' | 'kinshasa' | 'kasumbalesa' | 'goma' | 'autre';

export type IncotermType = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DDP' | 'autre';

export type RegimeDouanier = 
  | 'mise_a_la_consommation' // IM4 / C100
  | 'importation_temporaire' // IM5
  | 'entrepot_douanier'      // IM7
  | 'transit'                // IM8 / T1
  | 'reimportation'          // IM6
  | 'zone_franche_zes'       // ZES
  | 'autre';

export type SimulationStatus = 'brouillon' | 'simulation' | 'validee' | 'archivee';

export interface CodeTarifaireSH {
  id: string;
  code_sh: string; // 8 chiffres format RDC, ex: '8703.23.90'
  designation: string;
  section: string;
  chapitre: string;
  position: string;
  sous_position: string;
  taux_droit_douane: number; // En % (ex: 10 pour 10%)
  taux_accise: number;       // En % (ex: 0, 5, 10, 20%)
  taux_tva: number;          // En % (standard 16% en RDC, ou 0%)
  autres_taxes?: number;     // En % ou valeur fixe
  unite_taxation?: string;   // kg, unité, m3, litre, etc.
  regime_applicable?: string;
  origine_preferentielle?: string; // ZLECAF, SADC, COMESA
  base_legale: string;       // ex: "Loi de Finances RDC - Tarif SH 2022"
  version_tarif: string;     // ex: "SH 2022 v1.4"
  date_debut: string;
  date_fin?: string;
  actif: boolean;
  date_mise_a_jour: string;
  remarques?: string;
}

export interface MarchandiseLigne {
  id: string;
  designation: string;
  code_sh: string;
  sh_id?: string;
  quantite: number;
  unite: string;
  prix_unitaire_usd: number;
  valeur_fob_usd: number;
  fret_reparti_usd: number;
  assurance_repartie_usd: number;
  autres_frais_usd: number;
  valeur_caf_usd: number;
  valeur_caf_cdf: number;
  poids_kg: number;
  pays_origine: string;
  
  // Taux appliqués
  taux_ddi: number;
  taux_accise: number;
  taux_tva: number;
  taux_fpi: number;
  taux_occ: number;
  taux_rlf: number;
  
  // Montants calculés
  montant_ddi_usd: number;
  montant_accise_usd: number;
  montant_tva_usd: number;
  montant_fpi_usd: number;
  montant_occ_usd: number;
  montant_rlf_usd: number;
  montant_autres_taxes_usd: number;
  total_droits_taxes_usd: number;
  
  // Éléments de transparence
  calcul_detail?: {
    base_ddi: number;
    base_accise: number;
    base_tva: number;
    base_fpi: number;
    base_occ: number;
    base_rlf: number;
    formule_ddi: string;
    formule_accise: string;
    formule_tva: string;
  };
}

export interface FraisLogistiqueItem {
  id: string;
  libelle: string;
  categorie: 'portuaire' | 'manutention' | 'magasinage' | 'scanning' | 'declarant' | 'transport' | 'autre';
  montant_usd: number;
  montant_cdf: number;
  actif: boolean;
  base_calcul?: string;
  prestataire?: string; // SCTP, LMC, BIVAC, Concessionnaire, Transporteur
  description?: string;
}

export interface Exoneration {
  id: string;
  code: string;
  titre: string;
  type_exoneration: 'code_investissements' | 'minier' | 'diplomatique' | 'humanitaire' | 'convention' | 'autre';
  base_legale: string;
  beneficiaire: string;
  marchandises_concernees: string;
  date_debut: string;
  date_fin: string;
  taux_exoneration_ddi: number; // 100 = 100% exonéré
  taux_exoneration_tva: number;
  taux_exoneration_accises: number;
  taxes_concernees: string[];
  document_justificatif: string;
  actif: boolean;
}

export interface SimulationDédouanement {
  id: string;
  reference: string; // Ex: SIM-2026-MAT-0042
  date_creation: string;
  date_modification: string;
  statut: SimulationStatus;
  
  // Informations Conteneur
  conteneur_numero: string;
  conteneur_type: ContainerType;
  nombre_colis: number;
  poids_brut_kg: number;
  poids_net_kg: number;
  port_entree: PortEntree;
  nom_navire?: string;
  pays_origine: string;
  pays_provenance: string;
  pays_expedition: string;
  date_arrivee_prevue: string;
  numero_bl: string;
  numero_facture: string;
  devise_facturation: string;
  
  // Informations Commerciales & Importateur
  importateur_nom: string;
  importateur_adresse: string;
  importateur_rccm: string;
  importateur_id_nat: string;
  importateur_nif: string;
  importateur_telephone: string;
  importateur_email: string;
  fournisseur_nom: string;
  fournisseur_pays: string;
  fournisseur_adresse?: string;
  date_facture: string;
  incoterm: IncotermType;
  
  // Valeur en Douane Globale
  valeur_marchandise_fob_usd: number;
  fret_usd: number;
  assurance_usd: number;
  autres_elements_evaluation_usd: number;
  valeur_caf_globale_usd: number;
  valeur_caf_globale_cdf: number;
  
  // Taux de change appliqué (gelé au moment de la simulation)
  taux_change_usd_cdf: number;
  taux_change_eur_usd?: number;
  date_taux_change: string;
  version_tarif_utilisee: string;
  
  // Marchandises
  marchandises: MarchandiseLigne[];
  
  // Régime & Préférences
  regime_douanier: RegimeDouanier;
  accord_commercial?: string;
  preuve_origine?: string;
  exoneration_id?: string;
  exoneration_detail?: Exoneration;
  
  // Totaux Fiscaux DGDA
  total_ddi_usd: number;
  total_accises_usd: number;
  total_tva_usd: number;
  total_fpi_usd: number;
  total_occ_usd: number;
  total_rlf_usd: number;
  total_autres_redevances_usd: number;
  total_droits_et_taxes_usd: number;
  total_droits_et_taxes_cdf: number;
  
  // Frais Non Fiscaux / Logistiques
  frais_logistiques: FraisLogistiqueItem[];
  total_frais_logistiques_usd: number;
  total_frais_logistiques_cdf: number;
  
  // Coût Global Estimatif
  cout_global_estime_usd: number;
  cout_global_estime_cdf: number;
  
  // Notes et traçabilité
  observations?: string;
  cree_par?: string;
  historique_actions?: {
    date: string;
    action: string;
    utilisateur: string;
    details?: string;
  }[];
}

export type UserRole = 'Importateur' | 'Déclarant en Douane' | 'Transitaire' | 'Administrateur';

export interface TaxRuleConfig {
  id: string;
  tax_name: string;
  tax_code: string; // DDI, TVA, DA, RLF, FPI, OCC, DGRAD
  tax_type: 'pourcentage' | 'forfait';
  default_rate: number;
  tax_base: 'CAF' | 'CAF_DDI' | 'CAF_DDI_DA' | 'FOB' | 'FIXE';
  tax_base_formula?: string;
  hs_code?: string;
  regime?: string;
  origin?: string;
  legal_reference: string;
  effective_from: string;
  effective_to?: string;
  active: boolean;
}

export interface ExchangeRateConfig {
  id: string;
  date: string;
  usd_to_cdf: number;
  eur_to_usd: number;
  eur_to_cdf: number;
  source: string; // "Banque Centrale du Congo (BCC) / DGDA"
  actif: boolean;
}

export interface AuditLog {
  id: string;
  date: string;
  utilisateur: string;
  role: string;
  action: string;
  entite: string;
  entite_id?: string;
  ancienne_valeur?: string;
  nouvelle_valeur?: string;
  adresse_ip?: string;
}

export interface TariffVersion {
  id: string;
  nom_version: string; // Ex: "SH 2022 - DGDA RDC v2.1"
  date_debut: string;
  date_fin?: string;
  statut: 'actif' | 'archive' | 'brouillon';
  source_officielle: string;
  nombre_lignes: number;
  date_importation: string;
  importe_par: string;
}
