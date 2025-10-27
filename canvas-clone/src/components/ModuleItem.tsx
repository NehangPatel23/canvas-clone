import { useState, useRef, useEffect } from "react";
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

  // modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);

  // confirmations
  const [confirmDeleteModule, setConfirmDeleteModule] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<null | string>(
    null
  );

  // dropdowns
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [closingModuleMenu, setClosingModuleMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [closingItemMenu, setClosingItemMenu] = useState(false);

  // edit item state
  const [editItemOriginalLabel, setEditItemOriginalLabel] = useState("");
  const [editItemWorkingLabel, setEditItemWorkingLabel] = useState("");

  // refs
  const moduleMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const moduleMenuRef = useRef<HTMLDivElement | null>(null);
  const itemMenuRef = useRef<HTMLDivElement | null>(null);

  // click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showModuleMenu &&
        moduleMenuRef.current &&
        !moduleMenuRef.current.contains(e.target as Node) &&
        moduleMenuButtonRef.current &&
        !moduleMenuButtonRef.current.contains(e.target as Node)
      ) {
        startCloseModuleMenu();
      }

      if (
        showItemMenu &&
        itemMenuRef.current &&
        !itemMenuRef.current.contains(e.target as Node)
      ) {
        startCloseItemMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModuleMenu, showItemMenu]);

  // helpers
  function startCloseModuleMenu() {
    setClosingModuleMenu(true);
    setTimeout(() => {
      setShowModuleMenu(false);
      setClosingModuleMenu(false);
    }, 150);
  }

  function startCloseItemMenu() {
    setClosingItemMenu(true);
    setTimeout(() => {
      setShowItemMenu(null);
      setClosingItemMenu(false);
    }, 150);
  }

  function handleAddItem(newItem: { type: string; label: string }) {
    onAddItem?.(title, newItem);
    setShowAddItemModal(false);
  }

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

  // smart dropdown placement
  function getSmartDropdownPosition(
    anchorRect: DOMRect | null,
    fallbackX: number,
    fallbackY: number
  ) {
    const MENU_HEIGHT = 90;
    const GAP = 6;

    if (anchorRect) {
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const openUp = spaceBelow < MENU_HEIGHT;
      return {
        top: openUp
          ? anchorRect.top + window.scrollY - MENU_HEIGHT - GAP
          : anchorRect.bottom + window.scrollY + GAP,
        left: anchorRect.right - 160,
      };
    } else {
      const spaceBelow = window.innerHeight - fallbackY;
      const openUp = spaceBelow < MENU_HEIGHT;
      return {
        top: openUp ? fallbackY - MENU_HEIGHT - GAP : fallbackY + GAP,
        left: fallbackX - 160,
      };
    }
  }

  // ---------------- RENDER ----------------
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
        <div
          ref={moduleMenuRef}
          className={`fixed dropdown-fix z-[999999] w-40 rounded-md border border-gray-200 bg-white text-gray-800 ${
            closingModuleMenu ? "animate-fadeOutUp" : "animate-fadeInUp"
          }`}
          style={(() => {
            const rect = moduleMenuButtonRef.current
              ? moduleMenuButtonRef.current.getBoundingClientRect()
              : null;
            const pos = getSmartDropdownPosition(rect, 0, 0);
            return {
              top: pos.top,
              left: pos.left,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              color: "#2D3B45",
              isolation: "isolate",
              zIndex: 999999,
            };
          })()}
        >
          <button
            onClick={() => {
              startCloseModuleMenu();
              setShowEditModuleModal(true);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              startCloseModuleMenu();
              setConfirmDeleteModule(true);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 bg-white hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* Item Dropdown */}
      {showItemMenu && (
        <div
          ref={itemMenuRef}
          className={`fixed dropdown-fix z-[999999] w-40 rounded-md border border-gray-200 bg-white text-gray-800 ${
            closingItemMenu ? "animate-fadeOutUp" : "animate-fadeInUp"
          }`}
          style={(() => {
            const pos = getSmartDropdownPosition(
              null,
              showItemMenu.x,
              showItemMenu.y
            );
            return {
              top: pos.top,
              left: pos.left,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              color: "#2D3B45",
              isolation: "isolate",
              zIndex: 999999,
            };
          })()}
        >
          <button
            onClick={() => {
              startCloseItemMenu();
              setEditItemOriginalLabel(showItemMenu.label);
              setEditItemWorkingLabel(showItemMenu.label);
              setShowEditItemModal(true);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              startCloseItemMenu();
              setConfirmDeleteItem(showItemMenu.label);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 bg-white hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
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
