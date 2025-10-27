import { type ReactNode, useEffect, useRef, useState } from "react";

interface CanvasModalProps {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  widthClass?: string; // e.g., "max-w-md", "max-w-lg"
}

export default function CanvasModal({
  title,
  children,
  onClose,
  widthClass = "max-w-md",
}: CanvasModalProps) {
  const [closing, setClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Fade-out close
  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 200);
  }

  // Close on Esc or outside-click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    const onClick = (e: MouseEvent) => {
      if (e.target === backdropRef.current) handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 transition-opacity duration-200 ${
        closing ? "animate-fadeOut" : "animate-fadeIn"
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 w-full ${widthClass} mx-4 transform transition-all ${
          closing ? "animate-scaleOut" : "animate-scaleIn"
        }`}
      >
        {title && (
          <h2 className="text-xl font-semibold text-[#2D3B45] mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
