import { Modal } from "../ui/Modal";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareText: string;
  onCopy: () => void;
  copied: boolean;
}

export function ShareModal({ isOpen, onClose, shareText, onCopy, copied }: ShareModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share">
      <div className="p-3 border border-[#444] rounded-lg bg-[#151515] font-mono text-sm whitespace-pre leading-snug overflow-x-auto">
        {shareText}
      </div>
      <div className="mt-3 flex gap-2.5 justify-end">
        <button type="button" onClick={onCopy}>
          {copied ? "Copied" : "Copy to clipboard"}
        </button>
      </div>
    </Modal>
  );
}
