import React from 'react';
import { AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';

interface LegalDisclaimerBannerProps {
  compact?: boolean;
}

export const LegalDisclaimerBanner: React.FC<LegalDisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div id="legal-disclaimer-compact" className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold">Simulation indicative :</strong> Les montants calculés sont des estimations préalables. La liquidation définitive relève exclusivement de la <strong>DGDA</strong>.
          </span>
        </div>
        <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono font-medium shrink-0">
          SH 2022 RDC
        </span>
      </div>
    );
  }

  return (
    <div id="legal-disclaimer-full" className="bg-slate-900 border-l-4 border-amber-500 text-slate-200 p-4 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              AVIS RÉGLEMENTAIRE & NATURE DES SIMULATIONS
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Document non opposable
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
              « Cette application est un outil de simulation et de pré-calcul d’aide à la décision. Elle ne constitue en aucun cas une liquidation douanière officielle. Le montant définitif des droits, taxes, redevances et autres frais est déterminé souverainement par les services compétents de la <strong>DGDA</strong> (Direction Générale des Douanes et Accises) conformément au Tarif SH 2022 et à la législation en vigueur en République Démocratique du Congo. »
            </p>
          </div>
        </div>

        <a
          href="https://douane.gouv.cd/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700/80 px-3 py-2 rounded-lg border border-slate-700 transition shrink-0 font-medium"
        >
          <span>Portail DGDA RDC</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
