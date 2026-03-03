import React from 'react';
import { Download, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { RAModal } from '../ui/RAModal';
import { RAButton } from '../ui/RAButton';

export const DocumentViewerModal: React.FC = () => {
  const viewerDocument = useAppStore(s => s.viewerDocument);
  const closeDocumentViewer = useAppStore(s => s.closeDocumentViewer);

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
    <RAModal isOpen={true} onClose={closeDocumentViewer} variant="fullscreen" className="bg-black/95 backdrop-blur-xl" overlayClassName="bg-black/80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10 shrink-0">
        <h3 className="text-white font-medium truncate flex-1 pr-4">
          {viewerDocument.name || 'Documento adjunto'}
        </h3>
        <div className="flex gap-2 shrink-0">
          <RAButton
            variant="primary"
            onPress={handleDownload}
            className="bg-blue-600 hover:bg-blue-500"
            size="sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
          </RAButton>
          <RAButton variant="icon" aria-label="Cerrar visor" onPress={closeDocumentViewer} className="bg-white/10 hover:bg-white/20 text-white rounded-xl">
            <X size={20} />
          </RAButton>
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
    </RAModal>
  );
};
