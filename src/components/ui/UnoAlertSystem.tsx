'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Info, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ConfirmDialog {
  message: string;
  resolve: (confirmed: boolean) => void;
}

interface AlertContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  confirm: (message: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within UnoAlertProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNO Card accent colours
// ─────────────────────────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  {
    bg: string;
    border: string;
    icon: ReactNode;
    label: string;
    badgeBg: string;
  }
> = {
  success: {
    bg: 'bg-gradient-to-br from-[#1a2e1a] to-[#0a1a0a]',
    border: 'border-[#22c55e]',
    icon: <Check size={18} strokeWidth={3} />,
    label: 'UNO!',
    badgeBg: 'bg-[#22c55e] text-black',
  },
  error: {
    bg: 'bg-gradient-to-br from-[#2e1a1a] to-[#1a0a0a]',
    border: 'border-[#ef4444]',
    icon: <X size={18} strokeWidth={3} />,
    label: 'DRAW 4',
    badgeBg: 'bg-[#ef4444] text-white',
  },
  warning: {
    bg: 'bg-gradient-to-br from-[#2e2a1a] to-[#1a160a]',
    border: 'border-[#ffaa00]',
    icon: <AlertTriangle size={18} strokeWidth={3} />,
    label: 'SKIP',
    badgeBg: 'bg-[#ffaa00] text-black',
  },
  info: {
    bg: 'bg-gradient-to-br from-[#1a1e2e] to-[#0a0e1a]',
    border: 'border-[#3b82f6]',
    icon: <Info size={18} strokeWidth={3} />,
    label: 'REVERSE',
    badgeBg: 'bg-[#3b82f6] text-white',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────────────────────

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = variantConfig[toast.variant];

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 120, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        relative w-80 ${cfg.bg} border-2 ${cfg.border}
        rounded-[1.5rem] shadow-2xl overflow-hidden
        flex items-stretch
      `}
    >
      {/* Left accent strip */}
      <div className={`w-14 flex-shrink-0 flex flex-col items-center justify-center gap-1 py-4 ${cfg.badgeBg}`}>
        {cfg.icon}
        <span className="text-[7px] font-black uppercase tracking-widest rotate-0 leading-tight text-center">
          {cfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-white/90 leading-snug">{toast.message}</p>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors mt-0.5"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-14 right-0 h-0.5 ${cfg.badgeBg} opacity-60`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Corner oval accent */}
      <div className={`
        absolute top-2 right-2 w-5 h-5 rounded-full border-2
        ${cfg.border} opacity-30
      `} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Modal Component
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmModal({ dialog }: { dialog: ConfirmDialog }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={() => dialog.resolve(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="
          relative w-full max-w-sm
          bg-zinc-950 border border-white/10
          rounded-[2rem] overflow-hidden
          shadow-[0_20px_100px_rgba(0,0,0,0.8)]
        "
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffaa00]/10 blur-[50px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff5555]/10 blur-[50px] -z-10 rounded-full" />

        {/* Content */}
        <div className="px-10 pt-12 pb-10 space-y-8 flex flex-col items-center">
          {/* Professional Warning Icon */}
          <div className="relative group">
             <div className="absolute inset-0 bg-[#ffaa00]/20 blur-2xl rounded-full scale-150 animate-pulse" />
             <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#ffaa00]/20 to-black border border-[#ffaa00]/30 flex items-center justify-center shadow-inner">
               <AlertTriangle size={32} className="text-[#ffaa00] drop-shadow-[0_0_10px_rgba(255,170,0,0.5)]" strokeWidth={1.5} />
             </div>
          </div>

          <div className="space-y-3 text-center">
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                Arena Confirmation
             </h3>
             <p className="text-white/40 text-xs font-medium leading-relaxed tracking-wide px-2">
                {dialog.message}
             </p>
          </div>

          {/* Luxury Buttons */}
          <div className="grid grid-cols-1 w-full gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dialog.resolve(true)}
              className="
                h-14 rounded-2xl bg-[#ffaa00] text-black font-black uppercase text-[11px] tracking-[0.2em]
                hover:bg-[#ffbb33] transition-all
                flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,170,0,0.2)]
              "
            >
              <Check size={16} strokeWidth={3} />
              Confirm Action
            </motion.button>
            
            <button
              onClick={() => dialog.resolve(false)}
              className="
                h-14 rounded-2xl bg-white/5 border border-white/5
                text-white/30 font-black uppercase text-[11px] tracking-[0.2em]
                hover:bg-white/10 hover:text-white transition-all
                flex items-center justify-center gap-3
              "
            >
              <X size={16} strokeWidth={3} />
              Cancel
            </button>
          </div>
        </div>

        {/* Branding accents */}
        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-20">
           <Zap size={10} className="text-[#ffaa00]" fill="currentColor" />
           <span className="text-[8px] font-black uppercase tracking-widest text-[#ffaa00]">Uno System</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function UnoAlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmDialog({
        message,
        resolve: (confirmed: boolean) => {
          setConfirmDialog(null);
          resolve(confirmed);
        },
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmDialog && <ConfirmModal dialog={confirmDialog} />}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}
