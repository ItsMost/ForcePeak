import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

/**
 * One confirmation dialog for every destructive action.
 *
 * Props:
 *  - open, title, message
 *  - itemName:     name of the thing being deleted (shown in bold)
 *  - requireName:  when true, the Delete button stays disabled until itemName is typed exactly
 *  - onConfirm:    async () => void  (the real delete)
 *  - onClose:      () => void
 */
export default function ConfirmDeleteModal({ open, title, message, itemName, requireName = false, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    setBusy(false);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const expected = (itemName || '').trim();
  const nameOk = !requireName || (expected.length > 0 && typed.trim() === expected);

  const handleConfirm = async () => {
    if (!nameOk || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-pf-border bg-pf-card p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pf-danger/10">
          <AlertTriangle className="h-7 w-7 text-pf-danger" />
        </div>

        <h3 id="confirm-delete-title" className="mb-2 text-lg font-black text-pf-text-primary">{title}</h3>

        <p className="mb-4 text-sm leading-relaxed text-pf-text-muted" dir="auto">
          {message}
          {itemName && (
            <>
              {' '}
              <span className="font-black text-pf-text-primary">"{itemName}"</span>
            </>
          )}
        </p>

        {requireName && (
          <div className="mb-5 text-right" dir="rtl">
            <label htmlFor="confirm-delete-input" className="mb-1.5 block text-xs font-bold text-pf-text-muted">
              للتأكيد اكتب الاسم بالظبط: <span className="font-black text-pf-text-primary" dir="auto">{expected}</span>
            </label>
            <input
              id="confirm-delete-input"
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              dir="auto"
              autoComplete="off"
              className="w-full rounded-xl border border-pf-border bg-pf-bg px-3 py-2.5 text-sm font-bold text-pf-text-primary outline-none focus:border-pf-danger focus:ring-2 focus:ring-pf-danger/20"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-pf-elevated px-4 py-2.5 text-xs font-bold uppercase text-pf-text-secondary transition-colors hover:bg-pf-border"
          >
            إلغاء / Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!nameOk || busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-pf-danger px-4 py-2.5 text-xs font-bold uppercase text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            حذف / Delete
          </button>
        </div>
      </div>
    </div>
  );
}
