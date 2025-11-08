import { useState, useEffect } from "react";
import CanvasModal from "./CanvasModal";
import { Link as LinkIcon } from "lucide-react";

interface ItemModalProps {
  mode: "add" | "edit";
  initialValues?: {
    label: string;
    type: string;
    url?: string;
  };
  onClose: () => void;
  onSubmit: (item: { label: string; type: string; url?: string }) => void;
}

export default function ItemModal({
  mode,
  initialValues,
  onClose,
  onSubmit,
}: ItemModalProps) {
  const [label, setLabel] = useState(initialValues?.label || "");
  const [type, setType] = useState(initialValues?.type || "page");
  const [url, setUrl] = useState(initialValues?.url || "");
  const [showBadge, setShowBadge] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(type === "link");

  // Focus first field
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>("#item-label");
    input?.focus();
  }, []);

  // Prefill https:// for new links
  useEffect(() => {
    if (mode === "add" && type === "link" && url.trim() === "") {
      setUrl("https://");
    }
  }, [type, mode]);

  // Animate badge
  useEffect(() => {
    if (mode === "edit" && type === "link") {
      const t = setTimeout(() => setShowBadge(true), 60);
      return () => clearTimeout(t);
    } else setShowBadge(false);
  }, [mode, type]);

  // Animate URL input
  useEffect(() => {
    if (type === "link") {
      const t = setTimeout(() => setShowUrlInput(true), 80);
      return () => clearTimeout(t);
    } else {
      setShowUrlInput(false);
    }
  }, [type]);

  const handleSubmit = () => {
    if (!label.trim()) return;
    if (type === "link" && (!url.trim() || url.trim() === "https://")) {
      alert("Please enter a valid URL for the link item.");
      return;
    }

    onSubmit({
      label: label.trim(),
      type,
      url: type === "link" ? url.trim() : undefined,
    });
    onClose();
  };

  const titleText = mode === "add" ? "Add New Item" : "Edit Item";
  const buttonText = mode === "add" ? "Add Item" : "Save Changes";

  return (
    <CanvasModal title={titleText} onClose={onClose} size="md">
      <div className="space-y-5">
        {/* 🔗 Animated Link Item Badge */}
        {mode === "edit" && type === "link" && (
          <div
            className={`flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-700 font-medium transform transition-all duration-300 ease-out ${
              showBadge
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            <LinkIcon className="w-4 h-4 text-blue-600" />
            Link Item
          </div>
        )}

        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-[#2D3B45] mb-1">
            Item Name
          </label>
          <input
            id="item-label"
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
            disabled={mode === "edit"} // prevent type change after creation
          >
            <option value="page">Page</option>
            <option value="file">File</option>
            <option value="link">Link</option>
          </select>
        </div>

        {/* ✨ Smooth animated URL Input */}
        <div
          className={`transition-all duration-300 ease-out transform origin-top ${
            showUrlInput
              ? "opacity-100 scale-y-100 translate-y-0 max-h-40"
              : "opacity-0 scale-y-95 -translate-y-1 max-h-0 overflow-hidden"
          }`}
        >
          {type === "link" && (
            <div>
              <label className="block text-sm font-medium text-[#2D3B45] mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] placeholder-gray-400 focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none"
                placeholder="https://example.com"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
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
            {buttonText}
          </button>
        </div>
      </div>
    </CanvasModal>
  );
}
