import { useState, useEffect } from "react";

interface EditModuleModalProps {
  initialTitle: string;
  onClose: () => void;
  onSave: (newTitle: string) => void;
}

export default function EditModuleModal({
  initialTitle,
  onClose,
  onSave,
}: EditModuleModalProps) {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [closing, setClosing] = useState(false);

  const handleSave = () => {
    if (newTitle.trim()) {
      setClosing(true);
      setTimeout(() => {
        onSave(newTitle.trim());
      }, 200);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[999] transition-opacity duration-200 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-[420px] p-6 transform transition-all duration-200 ${
          closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <h2 className="text-lg font-semibold text-[#2D3B45] mb-4">
          Edit Module Name
        </h2>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Module Name
        </label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white appearance-none focus:ring-2 focus:ring-[#008EE2] focus:border-[#008EE2] text-gray-900 outline-none transition"
          placeholder="Enter new module title"
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-[#008EE2] text-white font-medium hover:bg-[#007ACC] transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
