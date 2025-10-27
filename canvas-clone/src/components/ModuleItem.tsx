import { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Link,
  MoreVertical,
  Plus,
} from "lucide-react";
import AddItemModal from "./AddItemModal";
import EditItemModal from "./EditItemModal";
import EditModuleModal from "./EditModuleModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import CanvasDropdown from "./CanvasDropdown";

interface CourseItem {
  type: string;
  label: string;
}

interface ModuleItemProps {
  title: string;
  items: ReadonlyArray<CourseItem>;
  onAddItem?: (
    moduleTitle: string,
    newItem: { type: string; label: string }
  ) => void;
  onEditModule?: (oldTitle: string, newTitle: string) => void;
  onDeleteModule?: (title: string) => void;
  onEditItem?: (
    moduleTitle: string,
    oldLabel: string,
    newLabel: string
  ) => void;
  onDeleteItem?: (moduleTitle: string, label: string) => void;
}

export default function ModuleItem({
  title,
  items,
  onAddItem,
  onEditModule,
  onDeleteModule,
  onEditItem,
  onDeleteItem,
}: ModuleItemProps) {
  const [open, setOpen] = useState(true);

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);

  // Confirmations
  const [confirmDeleteModule, setConfirmDeleteModule] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<null | string>(
    null
  );

  // Dropdowns
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // Edit state
  const [editItemOriginalLabel, setEditItemOriginalLabel] = useState("");
  const [editItemWorkingLabel, setEditItemWorkingLabel] = useState("");

  // Refs
  const moduleMenuButtonRef = useRef<HTMLDivElement | null>(null);

  // Add item
  function handleAddItem(newItem: { type: string; label: string }) {
    onAddItem?.(title, newItem);
    setShowAddItemModal(false);
  }

  // Save edited item
  function handleSaveItemEdit(newLabel: string) {
    if (onEditItem && editItemOriginalLabel) {
      onEditItem(title, editItemOriginalLabel, newLabel);
    }
    setShowEditItemModal(false);
    setEditItemOriginalLabel("");
    setEditItemWorkingLabel("");
  }

  function handleConfirmDeleteItem() {
    if (confirmDeleteItem && onDeleteItem) {
      onDeleteItem(title, confirmDeleteItem);
    }
    setConfirmDeleteItem(null);
  }

  function handleConfirmDeleteModule() {
    onDeleteModule?.(title);
    setConfirmDeleteModule(false);
  }

  // ---------- RENDER ----------
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-200 ease-in-out relative">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#F5F8FA] hover:bg-[#EEF3F6] px-4 py-3 border-b border-gray-200">
        <div
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 text-[15px] font-semibold text-[#2D3B45] cursor-pointer select-none"
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          {title}
        </div>

        <div
          className="flex items-center gap-4 relative"
          ref={moduleMenuButtonRef}
        >
          <Plus
            className="w-4 h-4 text-[#008EE2] hover:text-[#0079C2] cursor-pointer"
            onClick={() => setShowAddItemModal(true)}
          />
          <MoreVertical
            className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowModuleMenu((prev) => !prev);
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="group flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors relative"
          >
            <div className="flex items-center gap-3">
              {item.type === "page" && (
                <FileText className="w-4 h-4 text-gray-400" />
              )}
              {item.type === "file" && (
                <span className="text-gray-400 text-[13px] leading-none">📄</span>
              )}
              {item.type === "link" && (
                <Link className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700 text-[15px]">{item.label}</span>
            </div>

            <MoreVertical
              className="w-4 h-4 text-gray-400 hover:text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (e.currentTarget as unknown as HTMLElement).getBoundingClientRect();
                setShowItemMenu({
                  label: item.label,
                  x: rect.right,
                  y: rect.bottom + window.scrollY,
                });
              }}
            />
          </div>
        ))}
      </div>

      {/* Module Dropdown */}
      {showModuleMenu && (
        <CanvasDropdown
          anchorRef={moduleMenuButtonRef}
          items={[
            {
              label: "Edit",
              onClick: () => setShowEditModuleModal(true),
            },
            {
              label: "Delete",
              onClick: () => setConfirmDeleteModule(true),
              variant: "danger",
            },
          ]}
          onClose={() => setShowModuleMenu(false)}
        />
      )}

      {/* Item Dropdown */}
      {showItemMenu && (
        <CanvasDropdown
          position={{ x: showItemMenu.x, y: showItemMenu.y }}
          items={[
            {
              label: "Edit",
              onClick: () => {
                setEditItemOriginalLabel(showItemMenu.label);
                setEditItemWorkingLabel(showItemMenu.label);
                setShowEditItemModal(true);
              },
            },
            {
              label: "Delete",
              onClick: () => setConfirmDeleteItem(showItemMenu.label),
              variant: "danger",
            },
          ]}
          onClose={() => setShowItemMenu(null)}
        />
      )}

      {/* Modals */}
      {showAddItemModal && (
        <AddItemModal
          onClose={() => setShowAddItemModal(false)}
          onAdd={handleAddItem}
        />
      )}
      {showEditItemModal && (
        <EditItemModal
          initialLabel={editItemWorkingLabel}
          onClose={() => setShowEditItemModal(false)}
          onSave={handleSaveItemEdit}
        />
      )}
      {showEditModuleModal && (
        <EditModuleModal
          initialTitle={title}
          onClose={() => setShowEditModuleModal(false)}
          onSave={(newTitle) => {
            setShowEditModuleModal(false);
            onEditModule?.(title, newTitle);
          }}
        />
      )}
      {confirmDeleteModule && (
        <ConfirmDeleteModal
          title="Delete Module"
          message={`Are you sure you want to delete "${title}"?`}
          onCancel={() => setConfirmDeleteModule(false)}
          onConfirm={handleConfirmDeleteModule}
        />
      )}
      {confirmDeleteItem && (
        <ConfirmDeleteModal
          title="Delete Item"
          message={`Are you sure you want to delete "${confirmDeleteItem}"?`}
          onCancel={() => setConfirmDeleteItem(null)}
          onConfirm={handleConfirmDeleteItem}
        />
      )}
    </div>
  );
}
