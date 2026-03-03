import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { AlertCircle, HelpCircle, MessageSquare, X } from 'lucide-react';
import { RAModal } from '../ui/RAModal';
import { RAButton } from '../ui/RAButton';
import { RATextField } from '../ui/RATextField';

export const GlobalDialog = () => {
  const dialog = useAppStore(s => s.dialog);
  const closeDialog = useAppStore(s => s.closeDialog);
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

  return (
    <RAModal isOpen={true} onClose={handleCancel} className="md:w-[400px]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 text-nature-primary">
          <div className={`p-2 rounded-2xl ${dialog.isDestructive ? 'bg-red-50 text-red-500' : 'bg-nature-mint/50'}`}>
            <Icon size={24} />
          </div>
          <h2 className="text-xl font-sans font-bold text-text-primary">{dialog.title}</h2>
        </div>
        <RAButton variant="icon" aria-label="Cerrar" onPress={handleCancel}>
          <X size={20} />
        </RAButton>
      </div>

      {dialog.message && (
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          {dialog.message}
        </p>
      )}

      {dialog.type === 'prompt' && (
        <RATextField
          aria-label="Respuesta"
          autoFocus
          placeholder={dialog.inputPlaceholder}
          value={inputValue}
          onChange={setInputValue}
          className="mb-6"
          inputClassName="p-4"
        />
      )}

      <div className="flex gap-3 justify-end mt-2">
        {dialog.type !== 'alert' && (
          <RAButton variant="ghost" onPress={handleCancel}>
            {dialog.cancelText || 'Cancelar'}
          </RAButton>
        )}
        <RAButton
          variant={dialog.isDestructive ? 'danger' : 'primary'}
          onPress={handleConfirm}
          className="w-full md:w-auto"
        >
          {dialog.confirmText || 'Aceptar'}
        </RAButton>
      </div>
    </RAModal>
  );
};
