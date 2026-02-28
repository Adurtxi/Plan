import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { AlertCircle, HelpCircle, MessageSquare, X } from 'lucide-react';

export const GlobalDialog = () => {
  const { dialog, closeDialog } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog?.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog]);

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm?.(dialog.type === 'prompt' ? inputValue : undefined);
    closeDialog();
  };

  const handleCancel = () => {
    dialog.onCancel?.();
    closeDialog();
  };

  const Icon = dialog.type === 'alert' ? AlertCircle : dialog.type === 'confirm' ? HelpCircle : MessageSquare;
  const confirmClasses = dialog.isDestructive
    ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]'
    : 'bg-nature-primary hover:bg-nature-accent shadow-[0_4px_14px_0_rgba(45,90,39,0.39)]';

  return (
    <>
      <div className="fixed inset-0 bg-nature-primary/40 backdrop-blur-sm z-[9998] transition-opacity animate-fade-in" onClick={handleCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[400px] bg-white rounded-[32px] shadow-2xl z-[9999] p-6 flex flex-col animate-scale-in">

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 text-nature-primary">
            <div className={`p-2 rounded-2xl ${dialog.isDestructive ? 'bg-red-50 text-red-500' : 'bg-nature-mint/50'}`}>
              <Icon size={24} />
            </div>
            <h2 className="text-xl font-sans font-bold text-gray-800">{dialog.title}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {dialog.message && (
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {dialog.message}
          </p>
        )}

        {dialog.type === 'prompt' && (
          <input
            autoFocus
            type="text"
            placeholder={dialog.inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full bg-gray-50 border border-gray-100 focus:border-nature-primary rounded-xl p-4 text-sm outline-none transition-all mb-6 font-medium text-nature-text"
          />
        )}

        <div className="flex gap-3 justify-end mt-2">
          {dialog.type !== 'alert' && (
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
            >
              {dialog.cancelText || 'Cancelar'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all w-full md:w-auto text-sm ${confirmClasses}`}
          >
            {dialog.confirmText || 'Aceptar'}
          </button>
        </div>
      </div>
    </>
  );
};
