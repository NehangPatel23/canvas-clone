import { useEffect, useMemo, useState } from "react";
import CanvasModal from "./CanvasModal";
import type { ModuleT } from "../utils/modules";

type Props = {
  modules: ModuleT[];
  onClose: () => void;
  onCreate: (args: { title: string; targetModuleTitle: string }) => void;
};

export default function AddPageFromPagesModal({
  modules,
  onClose,
  onCreate,
}: Props) {
  const firstModule = modules[0]?.title ?? "";

  const [title, setTitle] = useState("");
  const [targetModuleTitle, setTargetModuleTitle] = useState(firstModule);

  const moduleOptions = useMemo(
    () => modules.map((m) => ({ label: m.title, value: m.title })),
    [modules]
  );

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(
      "#pages-new-page-title"
    );
    input?.focus();
  }, []);

  useEffect(() => {
    // If modules list changes (or loads later), ensure we still have a valid selection.
    if (targetModuleTitle) return;
    if (firstModule) setTargetModuleTitle(firstModule);
  }, [firstModule, targetModuleTitle]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (!targetModuleTitle) return;

    onCreate({ title: trimmed, targetModuleTitle });
    onClose();
  };

  return (
    <CanvasModal title="Create Page" onClose={onClose} size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#2D3B45] mb-1">
            Page title
          </label>
          <input
            id="pages-new-page-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] placeholder-gray-400 focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none"
            placeholder="e.g., Week 3 – Dynamic Programming"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2D3B45] mb-1">
            Add to module
          </label>
          <select
            value={targetModuleTitle}
            onChange={(e) => setTargetModuleTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none bg-white"
            disabled={moduleOptions.length === 0}
          >
            {moduleOptions.length === 0 ? (
              <option value="">No modules yet</option>
            ) : (
              moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
          {moduleOptions.length === 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Create a module first in Modules.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-[#2D3B45] bg-white hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !targetModuleTitle}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create
          </button>
        </div>
      </div>
    </CanvasModal>
  );
}
