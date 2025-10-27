import { useEffect, useState } from "react";

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: { type: "page" | "file" | "link"; label: string }) => void;
}

export default function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [type, setType] = useState<"page" | "file" | "link">("page");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd({ type, label: label.trim() });
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 z-50 transition-opacity duration-150 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-[420px] p-6 transform transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-lg font-semibold text-canvas-grayDark mb-4">
          Add New Item
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-2 text-gray-700 bg-white focus:ring-2 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "page" | "file" | "link")
                }
              >
                <option value="page">Page</option>
                <option value="file">File</option>
                <option value="link">Link</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md text-sm px-3 py-2 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#008EE2] focus:border-[#008EE2] bg-white outline-none"
                placeholder={`Enter ${type} name`}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-[6px] text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-[6px] text-sm rounded-md bg-[#008EE2] hover:bg-[#0079C2] text-white font-medium transition-all"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
