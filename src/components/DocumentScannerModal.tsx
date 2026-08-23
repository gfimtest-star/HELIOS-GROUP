import React, { useState, useRef } from 'react';
import { 
  Scan, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  X,
  FileCheck,
  AlertCircle 
} from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted?: (data: any) => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onDataExtracted
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);

      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(dropped);
    }
  };

  const handleScan = async () => {
    if (!file && !textContent.trim()) {
      setError('Veuillez importer une image de facture/BL ou coller le texte du document.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      let payload: any = {};
      if (filePreview) {
        payload.image_base64 = filePreview;
        payload.mime_type = file?.type || 'image/jpeg';
      } else {
        payload.text_content = textContent;
      }

      const response = await fetch('/api/ai/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors du scan');
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’analyse du document');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyToSimulation = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      onClose();
    }
  };

  return (
    <div id="scanner-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Scanner OCR Facture Commerciale & Connaissement (BL)
              </h3>
              <p className="text-xs text-blue-200">
                Extraction intelligente des données d'importation vers la simulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Upload Area */}
          {!extractedData ? (
            <div className="space-y-4">
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {filePreview ? (
                  <div className="space-y-2">
                    <img
                      src={filePreview}
                      alt="Aperçu facture"
                      className="max-h-48 rounded-lg shadow-sm mx-auto object-contain border border-slate-200"
                    />
                    <p className="text-xs font-semibold text-slate-700">{file?.name}</p>
                    <p className="text-[11px] text-blue-600 font-bold">Cliquer pour remplacer l’image</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Glissez-déposez ou cliquez pour importer une facture / connaissement BL
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Formats supportés : JPEG, PNG, WEBP (Facture maritime, Packing List, BL)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <label className="text-xs font-bold text-slate-700">
                    Ou collez le texte brut du document commercial :
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Collez ici le texte d'un devis, d'une facture proforma ou d'un email commercial..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleScan}
                  disabled={isScanning || (!file && !textContent.trim())}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extraction OCR en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Lancer l’Extraction IA</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Extracted Data Review */
            <div className="space-y-5">
              
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    Extraction réussie : {extractedData.type_document || 'Document commercial maritime'}
                  </span>
                </div>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  Scanner un autre document
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Importateur</span>
                  <p className="font-bold text-slate-900">{extractedData.importateur_nom || 'Non détecté'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">NIF: {extractedData.importateur_nif || 'N/A'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Fournisseur</span>
                  <p className="font-bold text-slate-900">{extractedData.fournisseur_nom || 'Non détecté'}</p>
                  <p className="text-[11px] text-slate-500">Pays: {extractedData.fournisseur_pays || 'N/A'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Facture & BL</span>
                  <p className="font-mono font-bold text-slate-900">N° {extractedData.numero_facture || 'N/A'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">BL: {extractedData.numero_bl || 'N/A'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Conteneur & Fret</span>
                  <p className="font-mono font-bold text-blue-900">{extractedData.conteneur_numero || 'N/A'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Fret: ${extractedData.fret_usd || 0} | Assurance: ${extractedData.assurance_usd || 0}</p>
                </div>

              </div>

              {/* Extracted Goods */}
              {extractedData.marchandises && extractedData.marchandises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Marchandises identifiées ({extractedData.marchandises.length})
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 font-semibold text-[11px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Désignation</th>
                          <th className="py-2 px-3">Code SH Suggéré</th>
                          <th className="py-2 px-3 text-center">Qté</th>
                          <th className="py-2 px-3 text-right">Prix ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {extractedData.marchandises.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-slate-900">{m.designation}</td>
                            <td className="py-2 px-3 font-mono text-blue-800 font-bold">{m.code_sh_suggere || '1006.30.00'}</td>
                            <td className="py-2 px-3 text-center font-mono">{m.quantite} {m.unite || 'U'}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">${m.prix_unitaire_usd}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleApplyToSimulation}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Transférer toutes les données dans la Simulation</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
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
