import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  Check, 
  Plus, 
  ShieldAlert, 
  Loader2, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { CodeTarifaireSH } from '../types/customs';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode?: (code: CodeTarifaireSH) => void;
}

interface RecommandationIA {
  code_sh: string;
  designation: string;
  taux_droit_douane: number;
  taux_accise: number;
  taux_tva: number;
  pertinence_explication: string;
  questions_affinement?: string[];
}

interface AIClassificationResult {
  analyse: string;
  recommandations: RecommandationIA[];
  avertissement_rtc: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectCode
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClassify = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erreur lors de la classification');
      }

      const data: AIClassificationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de communication avec l’Assistant IA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div id="ai-assistant-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-amber-400 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Assistant IA de Classification Douanière
              </h3>
              <p className="text-xs text-indigo-200">
                Identification assistée du code SH 8 chiffres officiel DGDA SH 2022
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Instructions and Quick examples */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="text-slate-700 font-medium leading-relaxed">
              Décrivez votre marchandise avec un maximum de précision (nature, usage, matière, puissance, état neuf ou d'occasion). L'IA recherchera parmi la nomenclature officielle de la DGDA sans inventer de taux.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-bold self-center">Exemples :</span>
              {[
                'Climatiseurs split 12000 BTU gaz R32',
                'Panneaux solaires photovoltaïques 450W',
                '1000 sacs de riz blanc 25kg',
                'Huile de palme raffinée pour consommation'
              ].map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(ex)}
                  className="bg-white hover:bg-indigo-50 text-indigo-900 hover:text-indigo-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Exemple : Je souhaite importer un conteneur de 150 congélateurs horizontaux de 300 litres pour usage commercial..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClassify}
                disabled={isLoading || !prompt.trim()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyse de la nomenclature en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Identifier le Code SH</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-800 text-xs">
              {error}
            </div>
          )}

          {/* Classification Results */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              
              {/* Technical Analysis */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl text-xs text-indigo-950 space-y-1">
                <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Analyse Douanière & Critères Techniques</span>
                </h4>
                <p className="leading-relaxed">{result.analyse}</p>
              </div>

              {/* Recommendations Cards */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Positions Tarifaires Officielles Recommandées ({result.recommandations.length})
                </h4>

                {result.recommandations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-indigo-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-blue-900 text-sm bg-blue-100 px-2.5 py-1 rounded-lg">
                          {rec.code_sh}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {rec.designation}
                        </span>
                      </div>

                      {/* Select Code Button */}
                      {onSelectCode && (
                        <button
                          onClick={() => {
                            onSelectCode({
                              id: `sh-${rec.code_sh}`,
                              code_sh: rec.code_sh,
                              designation: rec.designation,
                              section: 'Recommandation IA',
                              chapitre: `Chapitre ${rec.code_sh.substring(0, 2)}`,
                              position: rec.code_sh.substring(0, 4),
                              sous_position: rec.code_sh,
                              taux_droit_douane: rec.taux_droit_douane,
                              taux_accise: rec.taux_accise || 0,
                              taux_tva: rec.taux_tva || 16,
                              unite_taxation: 'Unité',
                              base_legale: 'Tarif SH 2022 DGDA RDC',
                              version_tarif: 'SH 2022',
                              actif: true
                            });
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Appliquer ce code</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.pertinence_explication}
                    </p>

                    {/* Rates Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                        DDI : {rec.taux_droit_douane}%
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        TVA : {rec.taux_tva}%
                      </span>
                      {rec.taux_accise > 0 && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                          Accises : {rec.taux_accise}%
                        </span>
                      )}
                    </div>

                    {/* Refinement questions */}
                    {rec.questions_affinement && rec.questions_affinement.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <span className="font-semibold text-slate-700">Questions pour confirmer le classement :</span>
                        <ul className="list-disc list-inside pl-2 space-y-0.5">
                          {rec.questions_affinement.map((q, qIdx) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* RTC Legal disclaimer */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Avertissement Renseignement Tarifaire Contraignant (RTC) :</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {result.avertissement_rtc || "Cette suggestion ne préjuge pas de la décision finale de la DGDA. Pour une sécurité juridique absolue, sollicitez un Renseignement Tarifaire Contraignant (RTC) auprès de la Direction Générale des Douanes et Accises."}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
