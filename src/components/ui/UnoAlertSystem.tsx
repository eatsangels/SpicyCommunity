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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      onClick={() => dialog.resolve(false)}
    >
      <motion.div
        initial={{ scale: 0.75, rotate: -3, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.75, rotate: 3, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="
          relative w-full max-w-sm
          bg-gradient-to-br from-zinc-900 to-black
          border-4 border-[#ffaa00]
          rounded-[2.5rem] overflow-hidden
          shadow-[0_0_60px_rgba(255,170,0,0.3)]
        "
      >
        {/* Top accent strip */}
        <div className="bg-[#ffaa00] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={22} className="text-black" fill="black" />
            <span className="text-black font-black uppercase italic tracking-[0.2em] text-sm">
              SpicyBracket
            </span>
          </div>
          {/* UNO-style circle */}
          <div className="w-8 h-8 rounded-full bg-black/20 border-2 border-black/30 flex items-center justify-center">
            <span className="text-black font-black text-xs italic">!</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          {/* Warning icon UNO card style */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-[1.5rem] border-4 border-[#ffaa00] bg-[#ffaa00]/10 flex items-center justify-center rotate-6 shadow-[0_0_30px_rgba(255,170,0,0.2)]">
              <AlertTriangle size={36} className="text-[#ffaa00] -rotate-6" />
            </div>
          </div>

          <p className="text-white/90 text-center font-bold leading-relaxed text-sm">
            {dialog.message}
          </p>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dialog.resolve(false)}
              className="
                h-12 rounded-2xl bg-white/5 border-2 border-white/10
                text-white/50 font-black uppercase text-[10px] tracking-widest
                hover:bg-white/10 hover:text-white transition-all
                flex items-center justify-center gap-2
              "
            >
              <X size={14} />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(239,68,68,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dialog.resolve(true)}
              className="
                h-12 rounded-2xl bg-[#ef4444] border-2 border-[#ef4444]
                text-white font-black uppercase text-[10px] tracking-widest
                hover:bg-[#dc2626] transition-all
                flex items-center justify-center gap-2
              "
            >
              <Check size={14} />
              Confirm
            </motion.button>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-3 left-3 text-[8px] font-black text-[#ffaa00]/30 italic rotate-180">UNO</div>
        <div className="absolute bottom-3 right-3 text-[8px] font-black text-[#ffaa00]/30 italic">UNO</div>
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
