import React from 'react';
import { Download, X } from 'lucide-react';
import { useAppStore } from '../../store';

export const DocumentViewerModal: React.FC = () => {
  const { viewerDocument, closeDocumentViewer } = useAppStore();

  if (!viewerDocument) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = viewerDocument.url;
    a.download = viewerDocument.name || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPDF = viewerDocument.type === 'application/pdf' || viewerDocument.url.startsWith('data:application/pdf');

  return (
    <div className="fixed inset-0 z-[6000] flex flex-col bg-black/95 backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10 shrink-0">
        <h3 className="text-white font-medium truncate flex-1 pr-4">
          {viewerDocument.name || 'Documento adjunto'}
        </h3>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold text-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={closeDocumentViewer}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-8">
        {isPDF ? (
          <iframe
            src={viewerDocument.url}
            title={viewerDocument.name || 'Visor PDF'}
            className="w-full h-full rounded-2xl bg-white shadow-2xl border border-white/20"
          />
        ) : (
          <img
            src={viewerDocument.url}
            alt={viewerDocument.name || 'Visor Imagen'}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        )}
      </div>
    </div>
  );
};
