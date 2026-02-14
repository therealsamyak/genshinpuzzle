interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <button
      type="button"
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-[9999] border-none p-0"
      onClick={onClose}
      aria-label="Close modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-[520px] max-w-[92vw] border border-[#444] rounded-[10px] bg-[#1f1f1f] p-3.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        {title && (
          <div className="flex justify-between items-center">
            <div className="font-bold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </button>
  );
}
