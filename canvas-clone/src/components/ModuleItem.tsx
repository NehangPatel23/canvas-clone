import { useMemo, useRef, useState } from "react";
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
  indent?: number;
  collapsed?: boolean; // only meaningful for type === "section"
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

  onIndentItem?: (moduleTitle: string, label: string) => void;
  onOutdentItem?: (moduleTitle: string, label: string) => void;

  onToggleSectionCollapsed?: (
    moduleTitle: string,
    sectionLabel: string
  ) => void;

  getItemId: (label: string) => `item:${string}:${string}`;
  getContainerId: () => `container:${string}`;

  // IMPORTANT: dropIndex is an index into the FULL `items` array of this module
  dropIndex: number | null;

  moduleIsHighlighted: boolean;

  onOpenPageItem?: (label: string, pageId?: string) => void;
  onOpenFileItem?: (label: string, fileId?: string) => void;
}

const transitionStyle = {
  transition:
    "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
};

function clampIndent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.floor(n)));
}

function placeholderId(moduleTitle: string, sectionLabel: string) {
  return `placeholder:${moduleTitle}:${sectionLabel}`;
}

type RenderEntry =
  | { kind: "item"; item: CourseItem; fullIndex: number }
  | {
      kind: "placeholder";
      sectionLabel: string;
      hiddenCount: number;
      insertIndex: number; // where a drop into this collapsed section should insert
    };

function buildRenderEntries(items: CourseItem[]): RenderEntry[] {
  // HYBRID collapse boundary:
  // A collapsed section hides subsequent rows until whichever comes first:
  //  (1) next section header, OR
  //  (2) an outdent boundary (row with indent <= sectionIndent)
  //
  // Note: this intentionally allows sections to act like "groups" that end when
  // indentation decreases back to the section's indent (or less).
  const entries: RenderEntry[] = [];

  let i = 0;
  while (i < items.length) {
    const it = items[i];

    if (it.type === "section" && it.collapsed) {
      const sectionIndent = clampIndent(it.indent ?? 0);

      let j = i + 1;
      let hiddenCount = 0;

      while (j < items.length) {
        const nxt = items[j];

        // Boundary 1: next section
        if (nxt.type === "section") break;

        // Boundary 2: outdent encountered (indent <= section indent)
        const nxtIndent = clampIndent(nxt.indent ?? 0);
        if (nxtIndent <= sectionIndent) break;

        hiddenCount += 1;
        j += 1;
      }

      entries.push({ kind: "item", item: it, fullIndex: i });

      entries.push({
        kind: "placeholder",
        sectionLabel: it.label,
        hiddenCount,
        insertIndex: j, // end boundary in FULL items array
      });

      i = j;
      continue;
    }

    entries.push({ kind: "item", item: it, fullIndex: i });
    i += 1;
  }

  return entries;
}

function SortableItemRow({
  item,
  getItemId,
  onOpenItemMenu,
  onToggleSection,
  onOpenPageItem,
  onOpenFileItem,
}: {
  item: CourseItem;
  getItemId: (label: string) => string;
  onOpenItemMenu: (e: React.MouseEvent, label: string) => void;
  onToggleSection?: (label: string) => void;
  onOpenPageItem?: (label: string, pageId?: string) => void;
  onOpenFileItem?: (label: string, fileId?: string) => void;
}) {
  const id = getItemId(item.label);
  const { attributes, listeners, setNodeRef, transform, isDragging, isOver } =
    useSortable({ id });

  const [tooltipPos, setTooltipPos] = useState<"left" | "center" | "right">(
    "center"
  );

  const isSection = item.type === "section";
  const indent = clampIndent(item.indent ?? 0);

  const baseLeft = 24;
  const indentStep = 24;
  const paddingLeft = baseLeft + indent * indentStep;

  const style = {
    transform: CSS.Transform.toString(transform),
    ...transitionStyle,
    zIndex: isDragging ? 40 : "auto",
    opacity: isDragging ? 0.85 : 1,
  } as React.CSSProperties;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    if (rect.right + 100 > screenWidth) setTooltipPos("right");
    else if (rect.left < 100) setTooltipPos("left");
    else setTooltipPos("center");
  };

  const SectionChevron = item.collapsed ? ChevronRight : ChevronDown;

  return (
    <div
      ref={setNodeRef}
      data-id={id}
      style={style}
      className={`group flex items-center justify-between py-3 pr-6 relative transition-all duration-150 ${
        isDragging
          ? "bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-blue-200 rounded-md"
          : isSection
          ? "bg-slate-50 border-y border-gray-200 hover:bg-slate-50"
          : "hover:bg-gray-50"
      } ${
        isOver && !isDragging
          ? "outline outline-1 outline-blue-200 bg-blue-50/40"
          : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0" style={{ paddingLeft }}>
        <div
          title="Drag to reorder"
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-opacity duration-150"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {isSection ? (
          <button
            type="button"
            onClick={() => onToggleSection?.(item.label)}
            className="flex items-center gap-2 min-w-0 text-left bg-transparent border-none p-0 focus:outline-none"
            title={item.collapsed ? "Expand section" : "Collapse section"}
          >
            <SectionChevron className="w-4 h-4 text-gray-400" />
            <span className="text-[12px] font-semibold tracking-wide text-gray-500 uppercase truncate">
              {item.label}
            </span>
          </button>
        ) : (
          <>
            {item.type === "page" && (
              <FileText className="w-4 h-4 text-gray-400" />
            )}
            {item.type === "file" && (
              <span className="text-gray-400 text-[13px] leading-none">📄</span>
            )}
            {item.type === "link" && (
              <LinkIcon className="w-4 h-4 text-gray-400" />
            )}

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
                <span className="truncate">{item.label}</span>

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
            ) : item.type === "page" ? (
              <button
                type="button"
                onClick={() => onOpenPageItem?.(item.label, item.pageId)}
                className="text-left text-gray-700 text-[15px] bg-transparent border-none p-0 focus:outline-none hover:underline truncate"
                title="Open page"
              >
                {item.label}
              </button>
            ) : item.type === "file" ? (
              <button
                type="button"
                onClick={() => onOpenFileItem?.(item.label, item.fileId)}
                className="text-left text-gray-700 text-[15px] bg-transparent border-none p-0 focus:outline-none hover:underline truncate"
                title="Open file preview"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-700 text-[15px] select-none truncate">
                {item.label}
              </span>
            )}
          </>
        )}
      </div>

      <MoreVertical
        className="w-4 h-4 text-gray-400 hover:text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => onOpenItemMenu(e, item.label)}
      />
    </div>
  );
}

function CollapsedPlaceholderRow({
  moduleTitle,
  sectionLabel,
  hiddenCount,
}: {
  moduleTitle: string;
  sectionLabel: string;
  hiddenCount: number;
}) {
  const pid = placeholderId(moduleTitle, sectionLabel);
  const { isOver, setNodeRef } = useDroppable({ id: pid });

  return (
    <div
      ref={setNodeRef}
      data-id={pid}
      className={`mx-6 my-2 rounded-md border border-dashed px-4 py-2 text-sm transition-colors ${
        isOver
          ? "border-blue-300 bg-blue-50/60 text-blue-700"
          : "border-gray-300 bg-gray-50 text-gray-600"
      }`}
    >
      <span className="font-medium">
        {hiddenCount} item{hiddenCount === 1 ? "" : "s"}
      </span>{" "}
      hidden — drop here to move into this section
    </div>
  );
}

export default function ModuleItem(props: ModuleItemProps) {
  const {
    title,
    items,
    fadeOut,
    courseId,
    onAddItem,
    onEditModule,
    onDeleteModule,
    onEditItem,
    onDeleteItem,
    onIndentItem,
    onOutdentItem,
    onToggleSectionCollapsed,
    getItemId,
    getContainerId,
    dropIndex,
    moduleIsHighlighted,
    onOpenPageItem,
    onOpenFileItem,
  } = props;

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

  const entries = useMemo(() => buildRenderEntries(items), [items]);

  const sortableIds = useMemo(
    () =>
      entries
        .filter((e) => e.kind === "item")
        .map((e) => getItemId((e as any).item.label)),
    [entries, getItemId]
  );

  const currentIndent = clampIndent(currentEditingItem?.indent ?? 0);
  const isEditingSection = currentEditingItem?.type === "section";
  const isEditingSectionCollapsed = !!currentEditingItem?.collapsed;

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
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {dropIndex === 0 && <DropIndicator />}

          {entries.map((entry, renderIdx) => {
            if (entry.kind === "item") {
              const item = entry.item;
              const fullIndex = entry.fullIndex;

              return (
                <div key={item.label} className="relative">
                  {dropIndex === fullIndex && <DropIndicator />}

                  <SortableItemRow
                    item={item}
                    getItemId={getItemId}
                    onToggleSection={(label) =>
                      onToggleSectionCollapsed?.(title, label)
                    }
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

                  {renderIdx === entries.length - 1 &&
                    dropIndex === items.length && <DropIndicator />}
                </div>
              );
            }

            const placeholderKey = `ph:${entry.sectionLabel}:${entry.insertIndex}`;
            return (
              <div key={placeholderKey} className="relative">
                {dropIndex === entry.insertIndex && <DropIndicator />}
                <CollapsedPlaceholderRow
                  moduleTitle={title}
                  sectionLabel={entry.sectionLabel}
                  hiddenCount={entry.hiddenCount}
                />
              </div>
            );
          })}

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
              label: "Indent",
              disabled: currentIndent >= 3,
              onClick: () => {
                const label = showItemMenu.label;
                setShowItemMenu(null);
                onIndentItem?.(title, label);
              },
            },
            {
              label: "Outdent",
              disabled: currentIndent <= 0,
              onClick: () => {
                const label = showItemMenu.label;
                setShowItemMenu(null);
                onOutdentItem?.(title, label);
              },
            },

            ...(isEditingSection
              ? ([
                  { type: "separator" as const },
                  {
                    label: isEditingSectionCollapsed
                      ? "Expand section"
                      : "Collapse section",
                    onClick: () => {
                      const label = showItemMenu.label;
                      setShowItemMenu(null);
                      onToggleSectionCollapsed?.(title, label);
                    },
                  },
                ] as const)
              : ([] as const)),

            { type: "separator" },

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
            onAddItem?.(title, { ...ni, indent: 0 });
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
            const merged: CourseItem = {
              ...updated,
              indent: currentEditingItem.indent ?? 0,
              collapsed:
                currentEditingItem.type === "section"
                  ? currentEditingItem.collapsed ?? false
                  : undefined,
            };

            if (props.onEditItemFull) {
              props.onEditItemFull(title, editItemOriginalLabel, merged);
            } else if (merged.label !== editItemOriginalLabel) {
              onEditItem?.(title, editItemOriginalLabel, merged.label);
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
