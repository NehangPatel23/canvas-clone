import { useEffect, useState, useRef, type RefObject } from "react";

interface CanvasDropdownProps {
  anchorRef?: RefObject<HTMLElement | null>; // ✅ fully safe and null-tolerant
  position?: { x: number; y: number };
  items: { label: string; onClick: () => void; variant?: "danger" }[];
  onClose: () => void;
}

export default function CanvasDropdown({
  anchorRef,
  position,
  items,
  onClose,
}: CanvasDropdownProps) {
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute position (auto flip upward if near bottom)
  function computePosition() {
    const rect = anchorRef?.current?.getBoundingClientRect();
    const MENU_HEIGHT = items.length * 38 + 16;
    const GAP = 6;

    const bottomY = rect ? rect.bottom + window.scrollY : position?.y ?? 0;
    const rightX = rect ? rect.right : position?.x ?? 0;
    const spaceBelow = window.innerHeight - bottomY;
    const openUp = spaceBelow < MENU_HEIGHT;

    return {
      top: openUp ? bottomY - MENU_HEIGHT - GAP : bottomY + GAP,
      left: rightX - 160,
    };
  }

  const { top, left } = computePosition();

  // Close when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(() => onClose(), 150);
  }

  return (
    <div
      ref={menuRef}
      className={`fixed z-[999999] w-40 rounded-md border border-gray-200 bg-white text-[#2D3B45] shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all ${
        closing ? "animate-fadeOutUp" : "animate-fadeInUp"
      }`}
      style={{
        top,
        left,
        backgroundColor: "#FFFFFF",
        isolation: "isolate",
      }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          onClick={() => {
            handleClose();
            setTimeout(it.onClick, 150);
          }}
          className={`block w-full text-left px-4 py-2 text-sm bg-white ${
            it.variant === "danger"
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
