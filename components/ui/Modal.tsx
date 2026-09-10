import React, { useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ocean-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${widthClass} bg-ocean-900 border border-electric/25 rounded-2xl shadow-2xl p-6 z-10 overflow-hidden`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(22, 131, 255, 0.15)',
        }}
      >
        {title && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-electric/15">
            <h3 className="text-lg font-bold font-display text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
