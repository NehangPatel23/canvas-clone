import { useState } from "react";
import CanvasModal from "./CanvasModal";

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: { type: string; label: string }) => void;
}

export default function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("page");

  function handleSubmit() {
    if (!label.trim()) return;
    onAdd({ type, label });
    onClose();
  }

  return (
    <CanvasModal title="Add New Item" onClose={onClose}>
      <div className="space-y-5">
        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-[#2D3B45] mb-1">
            Item Name
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] placeholder-gray-400 focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none"
            placeholder="Enter item title"
          />
        </div>

        {/* Type Selector */}
        <div>
          <label className="block text-sm font-medium text-[#2D3B45] mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none bg-white"
          >
            <option value="page">Page</option>
            <option value="file">File</option>
            <option value="link">Link</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-[#2D3B45] bg-white hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2] transition-all"
          >
            Add Item
          </button>
        </div>
      </div>
    </CanvasModal>
  );
}
