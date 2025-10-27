import { useState, useEffect } from "react";

interface AddModuleModalProps {
  onClose: () => void;
  onAdd: (title: string) => void;
}

export default function AddModuleModal({ onClose, onAdd }: AddModuleModalProps) {
  const [title, setTitle] = useState("");
  const [visible, setVisible] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150); // allow animation to finish before unmount
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 z-50 transition-opacity duration-150 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-[400px] p-6 transform transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-lg font-semibold text-canvas-grayDark mb-4">
          Add New Module
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#008EE2] focus:border-[#008EE2] bg-white outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 4 – Sorting Algorithms"
            autoFocus
          />

          <div className="flex justify-end items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-[#008EE2] hover:bg-[#0079C2] text-white font-medium transition-all"
            >
              Add Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
