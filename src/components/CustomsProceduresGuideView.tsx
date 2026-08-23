import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Clock, 
  CheckSquare, 
  Square, 
  Download, 
  FileCheck2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  AlertCircle
} from 'lucide-react';

interface ProcedureStep {
  stepNumber: number;
  title: string;
  intervenant: string;
  delaiMoyen: string;
  description: string;
  documentsExiges: {
    id: string;
    nom: string;
    description: string;
    obligatoire: boolean;
    organisme: string;
  }[];
  conseilsPratiques: string;
}

const PROCEDURES_STEPS: ProcedureStep[] = [
  {
    stepNumber: 1,
    title: 'Formalités Préalables à l\'Embarquement (Origine & GUICE)',
    intervenant: 'Importateur / Banque / GUICE / OCC / OGEFREM',
    delaiMoyen: '3 à 7 jours avant expédition',
    description: 'Ouverture de la déclaration d\'importation bancaire et souscription des documents de contrôle de conformité obligatoire.',
    documentsExiges: [
      {
        id: 'doc-id',
        nom: 'Déclaration d\'Importation (ID / IB / AV)',
        description: 'Enregistrée auprès d\'une banque commerciale agréée en RDC via le GUICE (Guichet Unique Intégral du Commerce Extérieur).',
        obligatoire: true,
        organisme: 'Banque Commerciale & BCC'
      },
      {
        id: 'doc-feri',
        nom: 'Fiche Électronique de Renseignement à l\'Importation (FERI)',
        description: 'Numéro FERI obligatoire souscrit auprès des mandataires OGEFREM au port d\'embarquement.',
        obligatoire: true,
        organisme: 'OGEFREM'
      },
      {
        id: 'doc-occ-bivac',
        nom: 'Attestation de Vérification OCC / BIVAC (AV / ARA)',
        description: 'Rapport d\'inspection avant embarquement pour marchandises d\'une valeur FOB > 2 500 $.',
        obligatoire: true,
        organisme: 'Office Congolais de Contrôle (OCC)'
      },
      {
        id: 'doc-co',
        nom: 'Certificat d\'Origine (ZLECAF / SADC / UE)',
        description: 'Justificatif ouvrant droit aux préférences tarifaires et exonérations de droits de douane.',
        obligatoire: false,
        organisme: 'Chambre de Commerce du Pays Exportateur'
      }
    ],
    conseilsPratiques: 'Ne jamais faire appareiller le navire sans l\'émission de la FERI OGEFREM sous peine d\'une amende légale majorée de 100% de la valeur de la redevance au port de Matadi.'
  },
  {
    stepNumber: 2,
    title: 'Arrivée du Navire, Manifeste & Échange Titres de Transport',
    intervenant: 'Ligne Maritime / MGT / SCTP / Déclarant Commissionnaire',
    delaiMoyen: '24 à 48 heures',
    description: 'Enregistrement du manifeste maritime dans Sydonia World et obtention du Bon à Délivrer (BAD) après paiement du fret et caution.',
    documentsExiges: [
      {
        id: 'doc-bl',
        nom: 'Connaissement Maritime Original (Bill of Lading - B/L)',
        description: 'Titre de propriété de la cargaison visé par l\'armateur.',
        obligatoire: true,
        organisme: 'Armateur / Ligne Maritime'
      },
      {
        id: 'doc-bad',
        nom: 'Bon à Délivrer (BAD)',
        description: 'Délivré par la ligne maritime après règlement du fret local, surestaries éventuelles et caution conteneur.',
        obligatoire: true,
        organisme: 'Agence Maritime Locale (CMA CGM, Maersk, MSC...)'
      },
      {
        id: 'doc-manifeste',
        nom: 'Numéro d\'Enregistrement du Manifeste Sydonia',
        description: 'Transmission électronique obligatoire par l\'armateur à la DGDA 24h avant accostage.',
        obligatoire: true,
        organisme: 'DGDA / Sydonia World'
      }
    ],
    conseilsPratiques: 'Récupérez le Bon à Délivrer dès l\'annonce d\'arrivée pour démarrer le délai de franchise armateur (10 à 14 jours).'
  },
  {
    stepNumber: 3,
    title: 'Déclaration Unique des Marchandises (DUM) sur Sydonia World',
    intervenant: 'Déclarant en Douane Agréé (Commissionnaire en Douane)',
    delaiMoyen: '24 heures',
    description: 'Saisie détaillée des articles, codes SH à 8 chiffres, assiettes CAF et génération du Bulletin de Liquidation.',
    documentsExiges: [
      {
        id: 'doc-dum',
        nom: 'Déclaration Unique des Marchandises (DUM - Modèle IM4)',
        description: 'Déclaration officielle en douane validée sur le serveur Sydonia World de la DGDA.',
        obligatoire: true,
        organisme: 'DGDA'
      },
      {
        id: 'doc-facture',
        nom: 'Facture Commerciale Définitive & Packing List',
        description: 'Facture détaillée avec mention Incoterm (FOB, CFR, CIF), poids brut/net et colisage.',
        obligatoire: true,
        organisme: 'Fournisseur / Exportateur'
      },
      {
        id: 'doc-dev',
        nom: 'Déclaration d\'Éléments de Valeur (DEV)',
        description: 'Formulaire DGDA justifiant les composantes FOB, fret et assurance.',
        obligatoire: true,
        organisme: 'Déclarant / DGDA'
      },
      {
        id: 'doc-assurance',
        nom: 'Police d\'Assurance Facultés à l\'Importation',
        description: 'Certificat d\'assurance maritime souscrit auprès d\'une compagnie d\'assurance agréée en RDC (ARCA).',
        obligatoire: true,
        organisme: 'Compagnie d\'Assurance (ARCA)'
      }
    ],
    conseilsPratiques: 'Assurez-vous de la concordance exacte des poids et descriptions entre la facture, le B/L et la déclaration Sydonia pour éviter le circuit Rouge.'
  },
  {
    stepNumber: 4,
    title: 'Paiement Bancaire au Compte Unique du Trésor (BOD / OP)',
    intervenant: 'Banque Intervenante / Trésor Public / DGRAD / DGDA',
    delaiMoyen: '24 heures',
    description: 'Règlement des droits et taxes liquidés par virement bancaire certifié et émission de la Quittance douanière.',
    documentsExiges: [
      {
        id: 'doc-blq',
        nom: 'Bulletin de Liquidation DGDA (BLQ)',
        description: 'État liquidatif détaillant DDI, Accises, TVA, RLF, FPI et taxes annexes.',
        obligatoire: true,
        organisme: 'DGDA'
      },
      {
        id: 'doc-bod',
        nom: 'Bordereau d\'Opération Douanière (BOD / Ordre de Paiement)',
        description: 'Preuve de paiement bancaire électronique certifié au Guichet Unique.',
        obligatoire: true,
        organisme: 'Banque Commerciale'
      },
      {
        id: 'doc-quittance',
        nom: 'Quittance Douanière Électronique DGDA',
        description: 'Attestation légale libératoire confirmant le paiement intégral des droits.',
        obligatoire: true,
        organisme: 'DGDA'
      }
    ],
    conseilsPratiques: 'Les paiements doivent s\'effectuer en Francs Congolais (CDF) au taux officiel du jour de liquidation.'
  },
  {
    stepNumber: 5,
    title: 'Contrôle Douanier, Visite / Scanning & Bon à Enlever (BAE)',
    intervenant: 'Inspecteur DGDA / OCC / Scanner Portuaire',
    delaiMoyen: '1 à 3 jours ouvrés',
    description: 'Traitement selon le circuit assigné par le système Sydonia (Vert = direct, Bleu = différé, Jaune = documentaire, Rouge = visite physique).',
    documentsExiges: [
      {
        id: 'doc-scan',
        nom: 'Rapport de Scanning Portuaire',
        description: 'Imagerie radiographique du conteneur effectuée au terminal MGT / SCTP.',
        obligatoire: true,
        organisme: 'Société de Scanning / DGDA'
      },
      {
        id: 'doc-bae',
        nom: 'Bon à Enlever Douanier (BAE)',
        description: 'Autorisation légale d\'enlèvement délivrée par l\'Inspecteur divisionnaire DGDA.',
        obligatoire: true,
        organisme: 'DGDA'
      }
    ],
    conseilsPratiques: 'En cas de circuit Rouge, le dépotage partiel ou total s\'effectue en présence conjointe des délégués DGDA, OCC et du déclarant.'
  },
  {
    stepNumber: 6,
    title: 'Facturation Portuaire, Sortie Terminal & Livraison',
    intervenant: 'MGT (Terminal) / SCTP / OGEFREM / Transporteur',
    delaiMoyen: '24 à 48 heures',
    description: 'Paiement des prestations terminales (acconage, scanning, séjour) et édition du Bon de Sortie.',
    documentsExiges: [
      {
        id: 'doc-facture-port',
        nom: 'Facture Portuaire Terminal (MGT / SCTP)',
        description: 'Frais de manutention quai, acconage, scanning et magasinage éventuel.',
        obligatoire: true,
        organisme: 'MGT / SCTP'
      },
      {
        id: 'doc-bsp',
        nom: 'Bon de Sortie Portuaire (BSP)',
        description: 'Laissez-passer final pour franchir la guérite du port de Matadi / Boma.',
        obligatoire: true,
        organisme: 'Autorité Portuaire'
      },
      {
        id: 'doc-feuille-route',
        nom: 'Feuille de Route Transporteur & Lettre de Voiture',
        description: 'Document pour l\'acheminement routier Matadi - Kinshasa par la RN1.',
        obligatoire: true,
        organisme: 'Transporteur Routier / Fret Ferroviaire'
      }
    ],
    conseilsPratiques: 'Inspectez scrupuleusement l\'état extérieur du conteneur et vérifiez le numéro du scellé avant signature du bon de sortie.'
  }
];

export const CustomsProceduresGuideView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const toggleDoc = (docId: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const currentStepData = PROCEDURES_STEPS.find(s => s.stepNumber === activeStep) || PROCEDURES_STEPS[0];

  // Calculate global checklist progress
  const allDocs = PROCEDURES_STEPS.flatMap(s => s.documentsExiges);
  const completedDocsCount = allDocs.filter(d => checkedDocs[d.id]).length;
  const progressPercent = Math.round((completedDocsCount / allDocs.length) * 100);

  return (
    <div id="customs-procedures-guide-view" className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Guide Officiel des Procédures de Dédouanement RDC
                </h1>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  GUICE & Sydonia World
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Parcours pas-à-pas des 6 étapes d'importation en RDC, checklist des documents obligatoires et conseils pratiques terrain (Matadi - Kinshasa).
              </p>
            </div>
          </div>

          {/* Checklist Progress Pill */}
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm">
              {progressPercent}%
            </div>
            <div className="text-xs">
              <div className="text-slate-400">Checklist Dossier :</div>
              <div className="font-bold text-white">{completedDocsCount} / {allDocs.length} documents validés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PROCEDURES_STEPS.map((step) => {
          const isActive = step.stepNumber === activeStep;
          const stepDocs = step.documentsExiges;
          const stepDone = stepDocs.every(d => checkedDocs[d.id]);

          return (
            <button
              key={step.stepNumber}
              type="button"
              onClick={() => setActiveStep(step.stepNumber)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                isActive 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                  : stepDone
                    ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300 hover:border-emerald-700'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Étape 0{step.stepNumber}</span>
                {stepDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className={`text-xs line-clamp-2 leading-tight ${isActive ? 'text-blue-100 font-medium' : 'text-slate-300'}`}>
                {step.title.split('(')[0]}
              </span>
              <div className="text-[10px] opacity-75 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{step.delaiMoyen.split(' ')[0]} {step.delaiMoyen.split(' ')[1]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        
        {/* Step Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                {currentStepData.stepNumber}
              </span>
              <h2 className="text-lg font-bold text-white">{currentStepData.title}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                Intervenant : <strong className="text-slate-200">{currentStepData.intervenant}</strong>
              </span>
              <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                Délai : <strong className="text-amber-300">{currentStepData.delaiMoyen}</strong>
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Documents Checklist for this step */}
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Documents & Pièces Justificatives Exigibles :</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentStepData.documentsExiges.map((doc) => {
              const isChecked = !!checkedDocs[doc.id];
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-700/60'
                      : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={`mt-0.5 shrink-0 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`}
                    >
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isChecked ? 'text-emerald-300 line-through' : 'text-white'}`}>
                          {doc.nom}
                        </span>
                        {doc.obligatoire ? (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-semibold border border-rose-500/30">
                            Obligatoire
                          </span>
                        ) : (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold border border-blue-500/30">
                            Optionnel
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {doc.description}
                      </p>
                      <div className="text-[10px] text-slate-500 font-medium pt-1">
                        Organisme émetteur : {doc.organisme}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Practical tips banner */}
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-300">Recommandation Stratégique pour le Déclarant :</span>
            <p className="text-slate-300 leading-relaxed">{currentStepData.conseilsPratiques}</p>
          </div>
        </div>

        {/* Navigation bottom buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            disabled={activeStep <= 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            ← Étape Précédente
          </button>

          <button
            type="button"
            disabled={activeStep >= PROCEDURES_STEPS.length}
            onClick={() => setActiveStep(prev => Math.min(PROCEDURES_STEPS.length, prev + 1))}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Étape Suivante</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
