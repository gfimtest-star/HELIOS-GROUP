import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SimulationDédouanement } from '../types/customs';
import { formatCurrencyUSD, formatCurrencyCDF } from './customsCalculator';

export function genererPretaxePDF(simulation: SimulationDédouanement) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryBlue = [11, 25, 44]; // Deep navy
  const accentGold = [217, 119, 6];
  const borderGrey = [203, 213, 225];

  // 1. En-tête officiel
  doc.setFillColor(11, 25, 44);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // DRC Accent stripe
  doc.setFillColor(0, 122, 255); // Blue
  doc.rect(0, 24, pageWidth / 3, 2.5, 'F');
  doc.setFillColor(255, 204, 0); // Yellow
  doc.rect(pageWidth / 3, 24, pageWidth / 3, 2.5, 'F');
  doc.setFillColor(206, 17, 38); // Red
  doc.rect((2 * pageWidth) / 3, 24, pageWidth / 3, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DOUANE CALCUL RDC — PRÉTAXE DOUANIÈRE', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('SIMULATION INDICATIVE DES DROITS & TAXES — PORT DE MATADI / RDC', 14, 18);

  doc.setFontSize(9);
  doc.text(`Réf: ${simulation.reference}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Date: ${new Date(simulation.date_creation).toLocaleDateString('fr-FR')}`, pageWidth - 14, 18, { align: 'right' });

  let currentY = 33;

  // 2. Avertissement Légal Immédiat
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, currentY, pageWidth - 28, 12, 1.5, 1.5, 'FD');
  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AVERTISSEMENT : DOCUMENT DE SIMULATION NON CONSTITUTIF D’UNE LIQUIDATION OFFICIELLE', 17, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Cette simulation est purement indicative. La liquidation définitive relève exclusivement de la DGDA selon la réglementation en vigueur.', 17, currentY + 8.5);

  currentY += 16;

  // 3. Cadres : Importateur & Conteneur (2 colonnes)
  const colWidth = (pageWidth - 32) / 2;

  // Colonne Gauche : Importateur & Facture
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(14, currentY, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 25, 44);
  doc.text('INFORMATIONS COMMERCIALES & IMPORTATEUR', 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Importateur : ${simulation.importateur_nom || 'Non spécifié'}`, 18, currentY + 12);
  doc.text(`RCCM : ${simulation.importateur_rccm || 'N/A'} | NIF : ${simulation.importateur_nif || 'N/A'}`, 18, currentY + 17);
  doc.text(`Fournisseur : ${simulation.fournisseur_nom || 'Non spécifié'} (${simulation.fournisseur_pays || 'N/A'})`, 18, currentY + 22);
  doc.text(`Facture N° : ${simulation.numero_facture || 'N/A'} | Date : ${simulation.date_facture || 'N/A'}`, 18, currentY + 27);
  doc.text(`Incoterm : ${simulation.incoterm || 'CIF'} | Devise : ${simulation.devise_facturation || 'USD'}`, 18, currentY + 32);
  doc.text(`Régime : ${simulation.regime_douanier.toUpperCase()} | Tarif : ${simulation.version_tarif_utilisee || 'SH 2022'}`, 18, currentY + 37);

  // Colonne Droite : Conteneur & Transport
  const col2X = 14 + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, currentY, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 25, 44);
  doc.text('DONNÉES DU CONTENEUR & TRANSPORT', col2X + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`N° Conteneur : ${simulation.conteneur_numero || 'N/A'}`, col2X + 4, currentY + 12);
  doc.text(`Type : ${simulation.conteneur_type.replace('_', ' ').toUpperCase()} | Port : ${simulation.port_entree.toUpperCase()}`, col2X + 4, currentY + 17);
  doc.text(`Bill of Lading (BL) : ${simulation.numero_bl || 'N/A'}`, col2X + 4, currentY + 22);
  doc.text(`Origine : ${simulation.pays_origine || 'N/A'} | Provenance : ${simulation.pays_provenance || 'N/A'}`, col2X + 4, currentY + 27);
  doc.text(`Poids Brut : ${simulation.poids_brut_kg || 0} kg | Colis : ${simulation.nombre_colis || 1}`, col2X + 4, currentY + 32);
  doc.text(`Taux de Change : 1 USD = ${simulation.taux_change_usd_cdf} CDF`, col2X + 4, currentY + 37);

  currentY += 46;

  // 4. Cadre Valeur en Douane (CAF)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 25, 44);
  doc.text('VALEUR EN DOUANE (CAF) :', 18, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`FOB : ${formatCurrencyUSD(simulation.valeur_marchandise_fob_usd)}  +  Fret : ${formatCurrencyUSD(simulation.fret_usd)}  +  Assurance : ${formatCurrencyUSD(simulation.assurance_usd)}`, 18, currentY + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`VALEUR CAF : ${formatCurrencyUSD(simulation.valeur_caf_globale_usd)}  (${formatCurrencyCDF(simulation.valeur_caf_globale_cdf)})`, pageWidth - 18, currentY + 8, { align: 'right' });

  currentY += 18;

  // 5. Tableau des Marchandises
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 25, 44);
  doc.text('DÉSIGNATION ET CLASSIFICATION TARIFAIRE DES MARCHANDISES', 14, currentY);
  currentY += 3;

  const tableMarchandises = simulation.marchandises.map((m, idx) => [
    `${idx + 1}`,
    m.designation,
    m.code_sh,
    `${m.quantite} ${m.unite}`,
    formatCurrencyUSD(m.valeur_caf_usd),
    `${m.taux_ddi}%`,
    `${m.taux_accise}%`,
    `${m.taux_tva}%`,
    formatCurrencyUSD(m.total_droits_taxes_usd)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Désignation', 'Code SH (8 ch.)', 'Qté', 'Valeur CAF', 'DDI', 'Accises', 'TVA', 'Total Droits']],
    body: tableMarchandises,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 25, 44],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Tableau Récapitulatif Droits et Taxes DGDA
  const taxRows = [
    ['Droit de Douane à l’Importation (DDI)', 'Valeur CAF', 'Selon Code SH (0 à 20%)', formatCurrencyUSD(simulation.total_ddi_usd), formatCurrencyCDF(simulation.total_ddi_usd * simulation.taux_change_usd_cdf)],
    ['Droits d’Accises (DA)', 'CAF + DDI', 'Code des Accises (0 à 50%)', formatCurrencyUSD(simulation.total_accises_usd), formatCurrencyCDF(simulation.total_accises_usd * simulation.taux_change_usd_cdf)],
    ['Taxe sur la Valeur Ajoutée (TVA)', 'CAF + DDI + Accises', '16.0 % légal', formatCurrencyUSD(simulation.total_tva_usd), formatCurrencyCDF(simulation.total_tva_usd * simulation.taux_change_usd_cdf)],
    ['Redevance Logistique Ferroviaire (RLF / OGEFREM)', 'Valeur CAF', '1.5 %', formatCurrencyUSD(simulation.total_rlf_usd), formatCurrencyCDF(simulation.total_rlf_usd * simulation.taux_change_usd_cdf)],
    ['Fonds de Promotion de l’Industrie (FPI)', 'Valeur CAF', '2.0 %', formatCurrencyUSD(simulation.total_fpi_usd), formatCurrencyCDF(simulation.total_fpi_usd * simulation.taux_change_usd_cdf)],
    ['Office Congolais de Contrôle (OCC)', 'Valeur CAF', '1.5 %', formatCurrencyUSD(simulation.total_occ_usd), formatCurrencyCDF(simulation.total_occ_usd * simulation.taux_change_usd_cdf)],
    ['Frais Informatiques & Timbre DGDA (DGRAD)', 'Forfaitaire', 'Sydonia World', formatCurrencyUSD(simulation.total_autres_redevances_usd), formatCurrencyCDF(simulation.total_autres_redevances_usd * simulation.taux_change_usd_cdf)],
    ['SOUS-TOTAL DROITS ET TAXES DGDA', 'Assiette cumulée', 'Total Fiscal', formatCurrencyUSD(simulation.total_droits_et_taxes_usd), formatCurrencyCDF(simulation.total_droits_et_taxes_cdf)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Détail des Droits & Redevances Fiscaux DGDA', 'Base Taxable', 'Taux Appliqué', 'Montant (USD)', 'Montant (CDF)']],
    body: taxRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 62, 98],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 31, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === taxRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check page overflow
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // 7. Frais Logistiques & Portuaires (Matadi)
  const fraisRows = simulation.frais_logistiques
    .filter(f => f.actif)
    .map(f => [
      f.libelle,
      f.prestataire || 'Portuaire',
      formatCurrencyUSD(f.montant_usd),
      formatCurrencyCDF(f.montant_cdf)
    ]);

  fraisRows.push([
    'SOUS-TOTAL FRAIS LOGISTIQUES & PORTUAIRES',
    'Matadi / LMC / SCTP / CAD',
    formatCurrencyUSD(simulation.total_frais_logistiques_usd),
    formatCurrencyCDF(simulation.total_frais_logistiques_cdf)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Poste Logistique & Portuaire (Non Fiscal)', 'Prestataire / Réf', 'Montant (USD)', 'Montant (CDF)']],
    body: fraisRows,
    theme: 'plain',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 42 },
      2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 31, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === fraisRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // 8. TOTAL GÉNÉRAL ESTIMATIF
  doc.setFillColor(11, 25, 44);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COÛT ESTIMATIF GLOBAL DU DÉDOUANEMENT :', 20, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('(Droits & Taxes DGDA + Frais Logistiques Portuaires Matadi)', 20, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36);
  doc.text(`${formatCurrencyUSD(simulation.cout_global_estime_usd)}`, pageWidth - 20, currentY + 6.5, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`${formatCurrencyCDF(simulation.cout_global_estime_cdf)}`, pageWidth - 20, currentY + 11.5, { align: 'right' });

  // 9. Bas de page avec mentions légales DGDA
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DOUANE CALCUL RDC — Outil professionnel d’aide à la décision et de simulation préalable au dédouanement.', 14, pageHeight - 10);
  doc.text('Source tarifaire : DGDA RDC (Système Harmonisé SH 2022). Document non opposable à l’administration douanière.', 14, pageHeight - 6);
  doc.text(`Page 1/1 — Généré le ${new Date().toLocaleString('fr-FR')}`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  // Télécharger le PDF
  doc.save(`Pretaxe_Douaniere_${simulation.reference || 'SIM'}_Matadi.pdf`);
}
