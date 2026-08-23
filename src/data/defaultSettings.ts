import { ExchangeRateConfig, FraisLogistiqueItem, TaxRuleConfig, Exoneration } from '../types/customs';
import { OFFICIAL_TARIF_SH_2022 } from './officialTarifSH2022';

export const DEFAULT_TARIF_SH_2022 = OFFICIAL_TARIF_SH_2022;

export const DEFAULT_EXCHANGE_RATE: ExchangeRateConfig = {
  id: 'rate-current',
  date: '2026-08-21',
  usd_to_cdf: 2850.00,
  eur_to_usd: 1.085,
  eur_to_cdf: 3092.25,
  source: 'Banque Centrale du Congo (BCC) / DGDA Taux Douanier Hebdomadaire',
  actif: true
};

export const DEFAULT_EXCHANGE_RATES: ExchangeRateConfig[] = [
  DEFAULT_EXCHANGE_RATE,
  {
    id: 'rate-prev-1',
    date: '2026-08-14',
    usd_to_cdf: 2840.00,
    eur_to_usd: 1.080,
    eur_to_cdf: 3067.20,
    source: 'Banque Centrale du Congo (BCC) / DGDA',
    actif: false
  }
];

export const DEFAULT_TAX_RULES: TaxRuleConfig[] = [
  {
    id: 'rule-ddi',
    tax_name: 'Droit de Douane à l’Importation (DDI)',
    tax_code: 'DDI',
    tax_type: 'pourcentage',
    default_rate: 10, // Variable selon code SH (0, 5, 10, 20%)
    tax_base: 'CAF',
    legal_reference: 'Ordonnance-Loi n° 10/002 portant Code des Douanes RDC & Tarif SH 2022 DGDA',
    effective_from: '2022-01-01',
    active: true
  },
  {
    id: 'rule-tva',
    tax_name: 'Taxe sur la Valeur Ajoutée (TVA)',
    tax_code: 'TVA',
    tax_type: 'pourcentage',
    default_rate: 16,
    tax_base: 'CAF_DDI_DA', // Base = CAF + DDI + Accises
    legal_reference: 'Ordonnance-Loi n° 10/001 du 20 août 2010 portant institution de la TVA en RDC (16%)',
    effective_from: '2012-01-01',
    active: true
  },
  {
    id: 'rule-accise',
    tax_name: 'Droits d’Accises (DA)',
    tax_code: 'DA',
    tax_type: 'pourcentage',
    default_rate: 0, // 0 à 50% selon produit (véhicules, téléphones, alcool, etc.)
    tax_base: 'CAF_DDI', // Base = CAF + DDI
    legal_reference: 'Ordonnance-Loi n° 18/002 portant Code des Accises en RDC',
    effective_from: '2018-03-13',
    active: true
  },
  {
    id: 'rule-fpi',
    tax_name: 'Taxe de Promotion de l’Industrie (FPI)',
    tax_code: 'FPI',
    tax_type: 'pourcentage',
    default_rate: 2.0,
    tax_base: 'CAF',
    legal_reference: 'Loi n° 89-031 portant création du Fonds de Promotion de l’Industrie (FPI - 2%)',
    effective_from: '1989-08-07',
    active: true
  },
  {
    id: 'rule-occ',
    tax_name: 'Redevance Contrôle de Conformité (OCC)',
    tax_code: 'OCC',
    tax_type: 'pourcentage',
    default_rate: 1.5,
    tax_base: 'CAF',
    legal_reference: 'Ordonnance n° 74/013 portant statut de l’Office Congolais de Contrôle (OCC - 1.5% min 50$)',
    effective_from: '1974-01-10',
    active: true
  },
  {
    id: 'rule-rlf',
    tax_name: 'Redevance Logistique Ferroviaire / OGEFREM (RLF)',
    tax_code: 'RLF',
    tax_type: 'pourcentage',
    default_rate: 1.5,
    tax_base: 'CAF',
    legal_reference: 'Décret n° 007/2012 fixant les redevances logistiques et de fret maritime OGEFREM/SNCC',
    effective_from: '2012-04-16',
    active: true
  },
  {
    id: 'rule-dgrad',
    tax_name: 'Redevance Informatique et Timbre Douanier DGDA',
    tax_code: 'DGRAD',
    tax_type: 'forfait',
    default_rate: 50.0, // Forfait standard en USD
    tax_base: 'FIXE',
    legal_reference: 'Arrêté ministériel fixant les taxes d’encadrement et redevance Sydonia World DGDA',
    effective_from: '2020-01-01',
    active: true
  }
];

export const DEFAULT_PORTS = [
  { id: 'matadi', nom: 'Port de Matadi (Kongo Central)', code: 'CDMAT', description: 'Principal port maritime de la RDC pour conteneurs et conventionnels' },
  { id: 'boma', nom: 'Port de Boma (Kongo Central)', code: 'CDBOM', description: 'Port maritime spécialisé véhicules d’occasion et vrac' },
  { id: 'kinshasa', nom: 'Port Fluvial / Beach Kinshasa', code: 'CDFIH', description: 'Entrepôts et plateformes logistiques de la capitale' },
  { id: 'kasumbalesa', nom: 'Poste Frontalier de Kasumbalesa (Haut-Katanga)', code: 'CDKAS', description: 'Corridor Sud / SADC pour fret routier' },
  { id: 'goma', nom: 'Poste Douanier de Goma / Corniche (Nord-Kivu)', code: 'CDGOM', description: 'Corridor Est / EAC' }
];

export const DEFAULT_LOGISTIC_FEES_MATADI: FraisLogistiqueItem[] = [
  {
    id: 'frais-thc-matadi',
    libelle: 'Frais de Terminal (THC - Terminal Handling Charge)',
    categorie: 'portuaire',
    montant_usd: 350.0,
    montant_cdf: 997500.0,
    actif: true,
    prestataire: 'SCTP / Concessionnaire Matadi Gateway Terminal (MGT)',
    description: 'Manutention terre/quai, mise sur parc et chargement sur camion'
  },
  {
    id: 'frais-scanning',
    libelle: 'Scanning Obligatoire Conteneur (Inspection non intrusive)',
    categorie: 'scanning',
    montant_usd: 120.0,
    montant_cdf: 342000.0,
    actif: true,
    prestataire: 'BIVAC / Sydonia Scan Matadi',
    description: 'Passage au scanner à rayons X à l’entrée du port de Matadi'
  },
  {
    id: 'frais-magasinage-sctp',
    libelle: 'Magasinage & Gardiennage Portuaire (Franchise 7 jours)',
    categorie: 'magasinage',
    montant_usd: 180.0,
    montant_cdf: 513000.0,
    actif: true,
    prestataire: 'SCTP Matadi',
    description: 'Stationnement sur terre-plein portuaire au-delà de la franchise'
  },
  {
    id: 'frais-declarant-cad',
    libelle: 'Honoraires Commissionnaire Agréé en Douane (CAD / Déclarant)',
    categorie: 'declarant',
    montant_usd: 450.0,
    montant_cdf: 1282500.0,
    actif: true,
    prestataire: 'Agence en Douane Agréée DGDA',
    description: 'Établissement Déclaration Unique (DU), suivi Sydonia, apurement'
  },
  {
    id: 'frais-transport-matadi-kin',
    libelle: 'Transport Corridor Matadi → Kinshasa (Route Nationale 1)',
    categorie: 'transport',
    montant_usd: 950.0,
    montant_cdf: 2707500.0,
    actif: false,
    prestataire: 'Transporteur Routier Agréé',
    description: 'Acheminement par semi-remorque porte-conteneur jusqu’à Kinshasa'
  },
  {
    id: 'frais-pesage-surete',
    libelle: 'Pesage VGM & Frais de Sûreté ISPS',
    categorie: 'portuaire',
    montant_usd: 60.0,
    montant_cdf: 171000.0,
    actif: true,
    prestataire: 'Lignes Maritimes Congolaises (LMC) / SCTP',
    description: 'Vérification masse brute certifiée et surveillance portuaire'
  }
];

export const DEFAULT_EXONERATIONS: Exoneration[] = [
  {
    id: 'exo-code-invest',
    code: 'EXO-CI-2002',
    titre: 'Agrément Code des Investissements (Loi n° 004/2002)',
    type_exoneration: 'code_investissements',
    base_legale: 'Arrêté Interministériel Plan-Finances n° 045/CAB/MIN/2023',
    beneficiaire: 'Entreprises agréées par l’ANAPI (Agence Nationale pour la Promotion des Investissements)',
    marchandises_concernees: 'Matériel lourd, machines industrielles, outillage et pièces de rechange neufs',
    date_debut: '2023-01-01',
    date_fin: '2028-12-31',
    taux_exoneration_ddi: 100, // 100% exonéré
    taux_exoneration_tva: 100,
    taux_exoneration_accises: 100,
    taxes_concernees: ['DDI', 'TVA', 'DA'],
    document_justificatif: 'Arrêté Interministériel d’Agrément ANAPI & Attestation d’exonération DGDA',
    actif: true
  },
  {
    id: 'exo-zlecaf',
    code: 'EXO-ZLECAF-01',
    titre: 'Accord Préférentiel ZLECAf (Zone de Libre-Échange Continentale Africaine)',
    type_exoneration: 'convention',
    base_legale: 'Décret n° 21/04 du 16 juillet 2021 portant ratification de la ZLECAf par la RDC',
    beneficiaire: 'Marchandises originaires certifiées d’un État partie à la ZLECAf',
    marchandises_concernees: 'Produits inscrits sur la liste des concessions tarifaires prioritaires',
    date_debut: '2022-01-01',
    date_fin: '2030-12-31',
    taux_exoneration_ddi: 100,
    taux_exoneration_tva: 0, // TVA reste due en régime intérieur
    taux_exoneration_accises: 0,
    taxes_concernees: ['DDI'],
    document_justificatif: 'Certificat d’Origine ZLECAf délivré par l’autorité douanière du pays exportateur',
    actif: true
  },
  {
    id: 'exo-minier',
    code: 'EXO-CODE-MINIER',
    titre: 'Régime Douanier Préférentiel du Code Minier (Loi n° 18/001)',
    type_exoneration: 'minier',
    base_legale: 'Articles 220 à 232 du Code Minier Révisé de la RDC',
    beneficiaire: 'Titulaires de droits miniers d’exploitation et carrières',
    marchandises_concernees: 'Équipements et consommables miniers inscrits sur la liste agréée',
    date_debut: '2018-03-09',
    date_fin: '2029-12-31',
    taux_exoneration_ddi: 80, // Taux préférentiel réduit à 2% au lieu de 10%/20%
    taux_exoneration_tva: 100,
    taux_exoneration_accises: 100,
    taxes_concernees: ['DDI', 'TVA', 'DA'],
    document_justificatif: 'Agrément liste minière conjointe Mines-Finances & Permis d’exploitation',
    actif: true
  }
];
