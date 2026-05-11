'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Props {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles = {
    success: { accent: '#7A8C5C', icon: <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#7A8C5C' }} /> },
    error:   { accent: '#B84D2C', icon: <XCircle    className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B84D2C' }} /> },
    info:    { accent: '#9C6B4A', icon: <Info       className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#9C6B4A' }} /> },
  }[type];

  return (
    // Mobile: full-width above safe area. sm+: floats bottom-right with max-w-sm.
    <div
      role="status"
      className="fixed z-[65] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm flex items-start gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-soft-lg text-sm card-luxe"
      style={{ borderLeft: `3px solid ${styles.accent}` }}
    >
      {styles.icon}
      <span className="flex-1 min-w-0 text-foreground whitespace-pre-line leading-relaxed break-words">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-textSecondary hover:text-foreground flex-shrink-0 mt-0.5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
