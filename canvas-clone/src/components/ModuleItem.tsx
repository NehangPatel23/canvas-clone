import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Link as LinkIcon,
  MoreVertical,
  Plus,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import EditModuleModal from "./EditModuleModal";
import ConfirmDeletePageModal from "./ConfirmDeleteModal";
import CanvasDropdown from "./CanvasDropdown";
import ItemModal from "./ItemModal";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DropIndicator from "./DropIndicator";

interface CourseItem {
  type: string;
  label: string;
  url?: string;
  pageId?: string;
  fileId?: string;
  fileName?: string;
}

interface ModuleItemProps {
  title: string;
  items: CourseItem[];
  fadeOut?: boolean;
  courseId?: string;

  onAddItem?: (moduleTitle: string, newItem: CourseItem) => void;
  onEditModule?: (oldTitle: string, newTitle: string) => void;
  onDeleteModule?: (title: string) => void;
  onEditItem?: (
    moduleTitle: string,
    oldLabel: string,
    newLabel: string
  ) => void;
  onEditItemFull?: (
    moduleTitle: string,
    oldLabel: string,
    updatedItem: CourseItem
  ) => void;
  onDeleteItem?: (moduleTitle: string, label: string) => void;

  getItemId: (label: string) => `item:${string}:${string}`;
  getContainerId: () => `container:${string}`;

  dropIndex: number | null;
  moduleIsHighlighted: boolean;

  onOpenPageItem?: (label: string, pageId?: string) => void;
  onOpenFileItem?: (label: string, fileId?: string) => void;
}

const transitionStyle = {
  transition:
    "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
};

function SortableItemRow({
  item,
  getItemId,
  onOpenItemMenu,
  onOpenPageItem,
  onOpenFileItem,
}: {
  item: CourseItem;
  getItemId: (label: string) => string;
  onOpenItemMenu: (e: React.MouseEvent, label: string) => void;
  onOpenPageItem?: (label: string, pageId?: string) => void;
  onOpenFileItem?: (label: string, fileId?: string) => void;
}) {
  const id = getItemId(item.label);
  const { attributes, listeners, setNodeRef, transform, isDragging, isOver } =
    useSortable({ id });
  const [tooltipPos, setTooltipPos] = useState<"left" | "center" | "right">(
    "center"
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    ...transitionStyle,
    zIndex: isDragging ? 40 : "auto",
    opacity: isDragging ? 0.85 : 1,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    if (rect.right + 100 > screenWidth) setTooltipPos("right");
    else if (rect.left < 100) setTooltipPos("left");
    else setTooltipPos("center");
  };

  return (
    <div
      ref={setNodeRef}
      data-id={id}
      style={style}
      className={`group flex items-center justify-between px-6 py-3 relative transition-all duration-150 ${
        isDragging
          ? "bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-blue-200 rounded-md"
          : "hover:bg-gray-50"
      } ${
        isOver && !isDragging
          ? "outline outline-1 outline-blue-200 bg-blue-50/40"
          : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          title="Drag to reorder"
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-opacity duration-150"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {item.type === "page" && <FileText className="w-4 h-4 text-gray-400" />}
        {item.type === "file" && (
          <span className="text-gray-400 text-[13px] leading-none">📄</span>
        )}
        {item.type === "link" && <LinkIcon className="w-4 h-4 text-gray-400" />}

        {item.type === "link" && item.url ? (
          <a
            href={
              item.url.startsWith("http") ? item.url : `https://${item.url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center gap-1 text-gray-700 text-[15px] select-none hover:text-gray-800 transition-colors group/link"
          >
            <span>{item.label}</span>

            <div
              className="relative flex items-center"
              onMouseEnter={handleMouseEnter}
            >
              <ExternalLink
                className="w-3.5 h-3.5 text-gray-400 opacity-0 translate-x-1 group-hover/link:translate-x-0 group-hover/link:opacity-100 transition-all duration-200 ease-out"
                strokeWidth={1.8}
              />

              <div
                className={`absolute top-full mt-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-sm shadow-[0_2px_6px_rgba(0,0,0,0.08)] z-50 opacity-0 translate-y-1.5 scale-95 pointer-events-none group-hover/link:opacity-100 group-hover/link:translate-y-0 group-hover/link:scale-100 transition-all duration-150 ease-out whitespace-nowrap
                  bg-white/95 border-gray-300/70 text-gray-700
                  ${
                    tooltipPos === "left"
                      ? "left-0"
                      : tooltipPos === "right"
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2"
                  }`}
              >
                Opens in new tab
                <div
                  className={`absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45
                    bg-white/95 border-l border-t border-gray-300/70`}
                />
              </div>
            </div>
          </a>
        ) : item.type === "page" && onOpenPageItem ? (
          <button
            type="button"
            onClick={() => onOpenPageItem(item.label, item.pageId)}
            className="text-left text-gray-700 text-[15px] bg-transparent border-none p-0 focus:outline-none hover:underline"
            title="Open page"
          >
            {item.label}
          </button>
        ) : item.type === "file" && onOpenFileItem ? (
          <button
            type="button"
            onClick={() => onOpenFileItem(item.label, item.fileId)}
            className="text-left text-gray-700 text-[15px] bg-transparent border-none p-0 focus:outline-none hover:underline"
            title="Open file preview"
          >
            {item.label}
          </button>
        ) : (
          <span className="text-gray-700 text-[15px] select-none">
            {item.label}
          </span>
        )}
      </div>

      <MoreVertical
        className="w-4 h-4 text-gray-400 hover:text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => onOpenItemMenu(e, item.label)}
      />
    </div>
  );
}

export default function ModuleItem({
  title,
  items,
  fadeOut,
  courseId,
  onAddItem,
  onEditModule,
  onDeleteModule,
  onEditItem,
  onEditItemFull,
  onDeleteItem,
  getItemId,
  getContainerId,
  dropIndex,
  moduleIsHighlighted,
  onOpenPageItem,
  onOpenFileItem,
}: ModuleItemProps) {
  const [open, setOpen] = useState(true);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);

  const [deleteModuleOpen, setDeleteModuleOpen] = useState(false);
  const [deleteItemLabel, setDeleteItemLabel] = useState<string | null>(null);

  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const [editItemOriginalLabel, setEditItemOriginalLabel] = useState("");
  const [currentEditingItem, setCurrentEditingItem] =
    useState<CourseItem | null>(null);

  const moduleMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: getContainerId(),
  });

  return (
    <div
      className={`border border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-200 ease-in-out relative ${
        fadeOut ? "animate-[shrinkFade_0.2s_ease-in-out_forwards]" : ""
      } ${moduleIsHighlighted ? "ring-2 ring-blue-400/50 bg-blue-50/50" : ""}`}
    >
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
          <div
            title="Add item"
            onClick={() => setShowAddItemModal(true)}
            className="cursor-pointer text-[#008EE2] hover:text-[#0079C2]"
          >
            <Plus className="w-4 h-4" />
          </div>
          <MoreVertical
            className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowModuleMenu((prev) => !prev);
            }}
          />
        </div>
      </div>

      <div
        ref={setDropRef}
        className={`transition-all duration-300 ease-in-out overflow-visible ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } ${isOver ? "bg-blue-50/40" : ""}`}
      >
        <SortableContext
          items={items.map((it) => getItemId(it.label))}
          strategy={verticalListSortingStrategy}
        >
          {dropIndex === 0 && <DropIndicator />}

          {items.map((item, idx) => (
            <div key={item.label} className="relative">
              <SortableItemRow
                item={item}
                getItemId={getItemId}
                onOpenItemMenu={(e, label) => {
                  e.stopPropagation();
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  setShowItemMenu({
                    label,
                    x: rect.right,
                    y: rect.bottom + window.scrollY,
                  });
                  setEditItemOriginalLabel(label);
                  setCurrentEditingItem(item);
                }}
                onOpenPageItem={onOpenPageItem}
                onOpenFileItem={onOpenFileItem}
              />
              {dropIndex === idx + 1 && <DropIndicator />}
            </div>
          ))}

          {items.length === 0 && (
            <div className="px-6 py-3 text-sm text-gray-400 border-t border-gray-100">
              Drop items here…
            </div>
          )}
        </SortableContext>
      </div>

      {showModuleMenu && (
        <CanvasDropdown
          anchorRef={moduleMenuButtonRef}
          items={[
            {
              label: "Edit",
              onClick: () => {
                setShowModuleMenu(false);
                setShowEditModuleModal(true);
              },
            },
            {
              label: "Delete",
              variant: "danger",
              onClick: () => {
                setShowModuleMenu(false);
                setDeleteModuleOpen(true);
              },
            },
          ]}
          onClose={() => setShowModuleMenu(false)}
        />
      )}

      {showItemMenu && (
        <CanvasDropdown
          position={{ x: showItemMenu.x, y: showItemMenu.y }}
          items={[
            {
              label: "Edit",
              onClick: () => {
                setShowItemMenu(null);
                setShowEditItemModal(true);
              },
            },
            {
              label: "Delete",
              variant: "danger",
              onClick: () => {
                const label = showItemMenu.label;
                setShowItemMenu(null);
                setDeleteItemLabel(label);
              },
            },
          ]}
          onClose={() => setShowItemMenu(null)}
        />
      )}

      {showAddItemModal && (
        <ItemModal
          mode="add"
          courseId={courseId}
          moduleTitle={title}
          onClose={() => setShowAddItemModal(false)}
          onSubmit={(ni) => {
            onAddItem?.(title, ni);
            setShowAddItemModal(false);
          }}
        />
      )}

      {showEditItemModal && currentEditingItem && (
        <ItemModal
          mode="edit"
          courseId={courseId}
          moduleTitle={title}
          initialValues={
            {
              label: currentEditingItem.label,
              type: currentEditingItem.type as any,
              url: currentEditingItem.url,
              fileId: currentEditingItem.fileId,
              fileName: currentEditingItem.fileName,
            } as any
          }
          onClose={() => {
            setShowEditItemModal(false);
            setEditItemOriginalLabel("");
            setCurrentEditingItem(null);
          }}
          onSubmit={(updated) => {
            if (onEditItemFull) {
              onEditItemFull(title, editItemOriginalLabel, updated);
            } else {
              if (updated.label !== editItemOriginalLabel) {
                onEditItem?.(title, editItemOriginalLabel, updated.label);
              }
            }
            setShowEditItemModal(false);
            setEditItemOriginalLabel("");
            setCurrentEditingItem(null);
          }}
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

      <ConfirmDeletePageModal
        isOpen={deleteModuleOpen}
        title="Delete module?"
        description={`This will permanently delete the module "${title}" and all items inside it. This cannot be undone.`}
        confirmText="Delete"
        onClose={() => setDeleteModuleOpen(false)}
        onConfirm={() => {
          onDeleteModule?.(title);
          setDeleteModuleOpen(false);
        }}
      />

      <ConfirmDeletePageModal
        isOpen={!!deleteItemLabel}
        title="Delete item?"
        description={
          deleteItemLabel
            ? `This will remove "${deleteItemLabel}" from the module "${title}". This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        onClose={() => setDeleteItemLabel(null)}
        onConfirm={() => {
          if (!deleteItemLabel) return;
          onDeleteItem?.(title, deleteItemLabel);
          setDeleteItemLabel(null);
        }}
      />
    </div>
  );
}
