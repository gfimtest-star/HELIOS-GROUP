import * as XLSX from 'xlsx';
import { SimulationDédouanement } from '../types/customs';

export function exporterSimulationExcel(simulation: SimulationDédouanement) {
  const wb = XLSX.utils.book_new();

  // FEUILLE 1 : RÉSUMÉ GÉNÉRAL
  const resumeData = [
    ['DOUANE CALCUL RDC — SIMULATION DE PRÉ-DÉDOUANEMENT'],
    ['DOCUMENT DE SIMULATION INDICATIF — NON CONSTITUTIF D’UNE LIQUIDATION OFFICIELLE DGDA'],
    [''],
    ['RÉFÉRENCE SIMULATION', simulation.reference],
    ['DATE CRÉATION', new Date(simulation.date_creation).toLocaleDateString('fr-FR')],
    ['STATUT', simulation.statut.toUpperCase()],
    ['PORT D’ENTRÉE', simulation.port_entree.toUpperCase()],
    ['VERSION TARIF UTILISÉE', simulation.version_tarif_utilisee],
    ['TAUX DE CHANGE (USD/CDF)', simulation.taux_change_usd_cdf],
    [''],
    ['DONNÉES IMPORTATEUR & COMMERCIALES'],
    ['Importateur', simulation.importateur_nom],
    ['RCCM', simulation.importateur_rccm],
    ['NIF', simulation.importateur_nif],
    ['ID National', simulation.importateur_id_nat],
    ['Fournisseur', simulation.fournisseur_nom],
    ['Pays Fournisseur', simulation.fournisseur_pays],
    ['Facture N°', simulation.numero_facture],
    ['Incoterm', simulation.incoterm],
    ['Régime Douanier', simulation.regime_douanier],
    [''],
    ['DONNÉES CONTENEUR & TRANSPORT'],
    ['N° Conteneur', simulation.conteneur_numero],
    ['Type Conteneur', simulation.conteneur_type],
    ['N° Bill of Lading (BL)', simulation.numero_bl],
    ['Pays d’Origine', simulation.pays_origine],
    ['Nombre de Colis', simulation.nombre_colis],
    ['Poids Brut (kg)', simulation.poids_brut_kg],
    ['Poids Net (kg)', simulation.poids_net_kg],
    [''],
    ['VALEUR EN DOUANE (CAF / CIF)'],
    ['Valeur Marchandise FOB (USD)', simulation.valeur_marchandise_fob_usd],
    ['Fret Maritime (USD)', simulation.fret_usd],
    ['Assurance (USD)', simulation.assurance_usd],
    ['Autres Ajustements (USD)', simulation.autres_elements_evaluation_usd],
    ['VALEUR CAF TOTALE (USD)', simulation.valeur_caf_globale_usd],
    ['VALEUR CAF TOTALE (CDF)', simulation.valeur_caf_globale_cdf],
    [''],
    ['SYNTHÈSE FINANCIÈRE GLOBALE'],
    ['Total Droits & Taxes DGDA (USD)', simulation.total_droits_et_taxes_usd],
    ['Total Droits & Taxes DGDA (CDF)', simulation.total_droits_et_taxes_cdf],
    ['Total Frais Logistiques & Portuaires (USD)', simulation.total_frais_logistiques_usd],
    ['Total Frais Logistiques & Portuaires (CDF)', simulation.total_frais_logistiques_cdf],
    ['COÛT ESTIMATIF GLOBAL DU DÉDOUANEMENT (USD)', simulation.cout_global_estime_usd],
    ['COÛT ESTIMATIF GLOBAL DU DÉDOUANEMENT (CDF)', simulation.cout_global_estime_cdf],
    [''],
    ['MENTION LÉGALE', 'Cette simulation est indicative. Le montant définitif des droits, taxes, redevances et autres frais est déterminé par les services compétents de la DGDA conformément à la réglementation en vigueur.']
  ];
  const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
  XLSX.utils.book_append_sheet(wb, wsResume, '1. Résumé');

  // FEUILLE 2 : MARCHANDISES
  const marchandisesData = [
    [
      'N°',
      'Désignation',
      'Code SH (8 ch.)',
      'Quantité',
      'Unité',
      'Poids (kg)',
      'Prix Unit. (USD)',
      'Valeur FOB (USD)',
      'Fret Rép. (USD)',
      'Assurance Rép. (USD)',
      'Valeur CAF (USD)',
      'Valeur CAF (CDF)',
      'Taux DDI (%)',
      'Taux Accise (%)',
      'Taux TVA (%)',
      'Montant DDI (USD)',
      'Montant Accises (USD)',
      'Montant TVA (USD)',
      'Total Droits Ligne (USD)'
    ],
    ...simulation.marchandises.map((m, idx) => [
      idx + 1,
      m.designation,
      m.code_sh,
      m.quantite,
      m.unite,
      m.poids_kg,
      m.prix_unitaire_usd,
      m.valeur_fob_usd,
      m.fret_reparti_usd,
      m.assurance_repartie_usd,
      m.valeur_caf_usd,
      m.valeur_caf_cdf,
      m.taux_ddi,
      m.taux_accise,
      m.taux_tva,
      m.montant_ddi_usd,
      m.montant_accise_usd,
      m.montant_tva_usd,
      m.total_droits_taxes_usd
    ])
  ];
  const wsMarchandises = XLSX.utils.aoa_to_sheet(marchandisesData);
  XLSX.utils.book_append_sheet(wb, wsMarchandises, '2. Marchandises');

  // FEUILLE 3 : DROITS ET TAXES DGDA
  const droitsData = [
    ['Taxe / Droit DGDA', 'Base Taxable', 'Taux Appliqué', 'Montant (USD)', 'Montant (CDF)', 'Base Légale RDC'],
    ['Droit de Douane à l’Importation (DDI)', 'Valeur CAF', '0 à 20% selon code SH', simulation.total_ddi_usd, simulation.total_ddi_usd * simulation.taux_change_usd_cdf, 'Code des Douanes & Tarif SH 2022 DGDA'],
    ['Droits d’Accises (DA)', 'CAF + DDI', 'Selon produit assujetti', simulation.total_accises_usd, simulation.total_accises_usd * simulation.taux_change_usd_cdf, 'Ordonnance-Loi n° 18/002 Code des Accises'],
    ['Taxe sur la Valeur Ajoutée (TVA)', 'CAF + DDI + Accises', '16.0 %', simulation.total_tva_usd, simulation.total_tva_usd * simulation.taux_change_usd_cdf, 'Ordonnance-Loi n° 10/001 portant TVA RDC'],
    ['Redevance Logistique Ferroviaire (RLF/OGEFREM)', 'Valeur CAF', '1.5 %', simulation.total_rlf_usd, simulation.total_rlf_usd * simulation.taux_change_usd_cdf, 'Décret n° 007/2012 OGEFREM'],
    ['Fonds de Promotion de l’Industrie (FPI)', 'Valeur CAF', '2.0 %', simulation.total_fpi_usd, simulation.total_fpi_usd * simulation.taux_change_usd_cdf, 'Loi n° 89-031 création FPI'],
    ['Office Congolais de Contrôle (OCC)', 'Valeur CAF', '1.5 %', simulation.total_occ_usd, simulation.total_occ_usd * simulation.taux_change_usd_cdf, 'Ordonnance n° 74/013 Statut OCC'],
    ['Frais Informatiques & Timbre DGDA (DGRAD)', 'Forfaitaire', 'Sydonia World', simulation.total_autres_redevances_usd, simulation.total_autres_redevances_usd * simulation.taux_change_usd_cdf, 'Arrêté Redevance Sydonia DGDA'],
    ['TOTAL DROITS ET TAXES DGDA', 'Assiette cumulée', 'Total Fiscal', simulation.total_droits_et_taxes_usd, simulation.total_droits_et_taxes_cdf, '']
  ];
  const wsDroits = XLSX.utils.aoa_to_sheet(droitsData);
  XLSX.utils.book_append_sheet(wb, wsDroits, '3. Droits et Taxes');

  // FEUILLE 4 : FRAIS LOGISTIQUES ET PORTUAIRES (MATADI)
  const logistiqueData = [
    ['Poste Logistique', 'Catégorie', 'Prestataire / Réf', 'Actif', 'Montant (USD)', 'Montant (CDF)'],
    ...simulation.frais_logistiques.map(f => [
      f.libelle,
      f.categorie,
      f.prestataire || 'Portuaire',
      f.actif ? 'OUI' : 'NON',
      f.montant_usd,
      f.montant_cdf
    ]),
    ['TOTAL FRAIS LOGISTIQUES RETENUS', '', '', '', simulation.total_frais_logistiques_usd, simulation.total_frais_logistiques_cdf]
  ];
  const wsLogistique = XLSX.utils.aoa_to_sheet(logistiqueData);
  XLSX.utils.book_append_sheet(wb, wsLogistique, '4. Frais Logistiques');

  // Sauvegarder le fichier Excel
  XLSX.writeFile(wb, `Simulation_Douane_RDC_${simulation.reference || 'SIM'}.xlsx`);
}
