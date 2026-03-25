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
    success: { border: 'border-accentGreen/40', icon: <CheckCircle className="w-4 h-4 text-accentGreen mt-0.5 flex-shrink-0" /> },
    error:   { border: 'border-accentRed/40',   icon: <XCircle    className="w-4 h-4 text-accentRed   mt-0.5 flex-shrink-0" /> },
    info:    { border: 'border-accentBlue/40',  icon: <Info       className="w-4 h-4 text-accentBlue  mt-0.5 flex-shrink-0" /> },
  }[type];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border bg-card max-w-sm text-sm ${styles.border}`}>
      {styles.icon}
      <span className="flex-1 text-foreground whitespace-pre-line leading-snug">{message}</span>
      <button onClick={onDismiss} className="text-textSecondary hover:text-foreground flex-shrink-0 ml-1 mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
