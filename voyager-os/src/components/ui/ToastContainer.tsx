import { useAppStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-floating border max-w-[90vw] md:max-w-md ${isSuccess ? 'bg-white border-nature-mint text-nature-text' :
                  isError ? 'bg-red-50 border-red-100 text-red-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                }`}
            >
              <div className={`${isSuccess ? 'text-green-500' : isError ? 'text-red-500' : 'text-blue-500'}`}>
                <Icon size={18} />
              </div>
              <p className="text-sm font-bold">{toast.message}</p>

              <div className="flex items-center gap-2 ml-4">
                {toast.onUndo && (
                  <button
                    onClick={() => {
                      toast.onUndo?.();
                      removeToast(toast.id);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-nature-primary bg-nature-mint/50 hover:bg-nature-mint px-2 py-1 rounded-md transition-colors"
                  >
                    <Undo2 size={12} /> Deshacer
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
