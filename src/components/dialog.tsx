'use client';
import { useEffect, useRef, useId } from 'react';
export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focus = document.activeElement as HTMLElement | null;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    return () => {
      if (open) {
        el.close();
        focus?.focus();
      }
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
