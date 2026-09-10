import React, { useEffect } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
  position?: 'right' | 'left';
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = 420,
  position = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isRight = position === 'right';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ocean-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 ${isRight ? 'right-0' : 'left-0'} flex max-w-full`}
      >
        <div
          className="relative flex flex-col bg-ocean-950/95 border-l border-electric/20 shadow-2xl backdrop-blur-xl h-full"
          style={{
            width,
            maxWidth: '100vw',
            boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(22, 131, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-electric/15 shrink-0">
            <div>{title}</div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-ocean-800"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scroll-hidden p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
