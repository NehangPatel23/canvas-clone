import { useMemo, useState } from "react";
import CourseHeader from "../components/CourseHeader";
import ModuleItem from "../components/ModuleItem";
import AddModuleModal from "../components/AddModuleModal";
import { Plus, GripVertical } from "lucide-react";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  DragOverlay,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Item = {
  type: string;
  label: string;
  url?: string;
};
type ModuleT = { title: string; items: Item[] };

type IdModule = `module:${string}`;
type IdItem = `item:${string}:${string}`;
type IdContainer = `container:${string}`;
type AnyId = IdModule | IdItem | IdContainer;

const modId = (title: string): IdModule => `module:${title}`;
const itemId = (moduleTitle: string, label: string): IdItem =>
  `item:${moduleTitle}:${label}`;
const containerId = (moduleTitle: string): IdContainer =>
  `container:${moduleTitle}`;

function parseId(id: string) {
  if (id.startsWith("module:")) return { kind: "module" as const, title: id.slice(7) };
  if (id.startsWith("item:")) {
    const rest = id.slice(5);
    const i = rest.indexOf(":");
    return { kind: "item" as const, moduleTitle: rest.slice(0, i), label: rest.slice(i + 1) };
  }
  if (id.startsWith("container:")) return { kind: "container" as const, moduleTitle: id.slice(10) };
  return { kind: "unknown" as const };
}

const restrictToVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const transitionStyle = {
  transition: "transform 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
};

function DraggableModuleShell(props: {
  id: IdModule;
  title: string;
  items: Item[];
  fadeOut: boolean;
  onAddItem: (moduleTitle: string, newItem: Item) => void;
  onEditItem: (moduleTitle: string, oldLabel: string, newLabel: string) => void;
  onEditItemFull: (moduleTitle: string, oldLabel: string, updatedItem: Item) => void;
  onDeleteItem: (moduleTitle: string, labelToRemove: string) => void;
  onEditModule: (oldTitle: string, newTitle: string) => void;
  onDeleteModule: (titleToDelete: string) => void;
  getItemId: (label: string) => IdItem;
  getContainerId: () => IdContainer;

  dropIndex: number | null;
  moduleIsHighlighted: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    ...transitionStyle,
    zIndex: isDragging ? 60 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-start group rounded-xl transition-all ${
        isDragging
          ? "translate-y-2 shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-2 ring-blue-300/40 bg-white/95 backdrop-blur-sm duration-200"
          : "shadow-sm hover:shadow-md hover:shadow-gray-300/40 duration-100"
      } ${props.moduleIsHighlighted ? "ring-2 ring-blue-400/60 bg-blue-50/60" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-opacity duration-150"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <ModuleItem
          title={props.title}
          items={props.items}
          fadeOut={props.fadeOut}
          onAddItem={props.onAddItem}
          onEditItem={props.onEditItem}
          onEditItemFull={props.onEditItemFull}
          onDeleteItem={props.onDeleteItem}
          onEditModule={props.onEditModule}
          onDeleteModule={props.onDeleteModule}
          getItemId={props.getItemId}
          getContainerId={props.getContainerId}
          dropIndex={props.dropIndex}
          moduleIsHighlighted={props.moduleIsHighlighted}
        />
      </div>
    </div>
  );
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleT[]>([
    {
      title: "Week 1 – Introduction",
      items: [
        { type: "page", label: "Course Overview" },
        { type: "file", label: "Syllabus.pdf" },
      ],
    },
    {
      title: "Week 2 – Algorithms and Complexity",
      items: [
        { type: "page", label: "Lecture Slides" },
        { type: "file", label: "ExampleProblems.docx" },
        { type: "link", label: "Supplementary Reading", url: "https://example.com" },
      ],
    },
  ]);

  const [fadingModules, setFadingModules] = useState<Set<string>>(new Set());
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [activeId, setActiveId] = useState<AnyId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ moduleTitle: string | null; index: number | null }>({
    moduleTitle: null,
    index: null,
  });
  const [highlightModuleTitle, setHighlightModuleTitle] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleAddModule = (newModuleTitle: string) => {
    setModules((prev) => [...prev, { title: newModuleTitle, items: [] }]);
    setShowAddModuleModal(false);
  };

  const handleEditModule = (oldTitle: string, newTitle: string) => {
    setModules((prev) => prev.map((m) => (m.title === oldTitle ? { ...m, title: newTitle } : m)));
  };

  const handleDeleteModule = (title: string) => {
    setFadingModules((prev) => new Set([...prev, title]));
    setTimeout(() => {
      setModules((prev) => prev.filter((m) => m.title !== title));
      setFadingModules((prev) => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
    }, 250);
  };

  const handleAddItemToModule = (moduleTitle: string, newItem: Item) => {
    setModules((prev) =>
      prev.map((m) => (m.title === moduleTitle ? { ...m, items: [...m.items, newItem] } : m))
    );
  };

  const handleEditItemInModule = (moduleTitle: string, oldLabel: string, newLabel: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title === moduleTitle
          ? {
              ...m,
              items: m.items.map((it) =>
                it.label === oldLabel ? { ...it, label: newLabel } : it
              ),
            }
          : m
      )
    );
  };

  // ✅ New — handles label + URL edits
  const handleEditItemInModuleFull = (
    moduleTitle: string,
    oldLabel: string,
    updatedItem: Item
  ) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title === moduleTitle
          ? {
              ...m,
              items: m.items.map((it) =>
                it.label === oldLabel
                  ? { ...it, label: updatedItem.label, url: updatedItem.url }
                  : it
              ),
            }
          : m
      )
    );
  };

  const handleDeleteItemInModule = (moduleTitle: string, label: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title === moduleTitle
          ? { ...m, items: m.items.filter((it) => it.label !== label) }
          : m
      )
    );
  };

  const activeMeta = useMemo(() => {
    if (!activeId) return null;
    const p = parseId(String(activeId));
    if (p.kind === "module") {
      const mod = modules.find((m) => m.title === p.title);
      return mod ? { type: "module" as const, title: mod.title, count: mod.items.length } : null;
    }
    if (p.kind === "item") {
      const it = modules.find((m) => m.title === p.moduleTitle)?.items.find((i) => i.label === p.label);
      return it ? { type: "item" as const, label: it.label } : null;
    }
    return null;
  }, [activeId, modules]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as AnyId);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const a = parseId(String(active.id));
    const b = parseId(String(over.id));

    setHighlightModuleTitle(null);
    setDropIndicator({ moduleTitle: null, index: null });

    if (a.kind === "module" && b.kind === "module") {
      setHighlightModuleTitle(b.title);
      return;
    }

    if (a.kind === "item") {
      if (b.kind === "item") {
        const overElem = document.querySelector(`[data-id='${over.id}']`);
        if (!overElem) return;

        const rect = overElem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const clientY = (event.activatorEvent as MouseEvent)?.clientY ?? midY;
        const insertBefore = clientY < midY;
        const modTitle = b.moduleTitle;
        const overModule = modules.find((m) => m.title === modTitle);
        if (!overModule) return;

        const targetIndex = overModule.items.findIndex((it) => it.label === b.label);
        const finalIndex = insertBefore ? targetIndex : targetIndex + 1;

        setDropIndicator({ moduleTitle: modTitle, index: finalIndex });
        return;
      }

      if (b.kind === "container") {
        setDropIndicator({
          moduleTitle: b.moduleTitle,
          index: modules.find((m) => m.title === b.moduleTitle)?.items.length ?? 0,
        });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setDropIndicator({ moduleTitle: null, index: null });
    setHighlightModuleTitle(null);
    if (!over) return;

    const a = parseId(String(active.id));
    const b = parseId(String(over.id));

    if (a.kind === "module" && b.kind === "module") {
      setModules((prev) => {
        const from = prev.findIndex((m) => m.title === a.title);
        const to = prev.findIndex((m) => m.title === b.title);
        if (from < 0 || to < 0 || from === to) return prev;
        return arrayMove(prev, from, to);
      });
      return;
    }

    if (a.kind === "item" && (b.kind === "item" || b.kind === "container")) {
      setModules((prev) => {
        const fromIdx = prev.findIndex((m) => m.title === a.moduleTitle);
        const toIdx = prev.findIndex((m) => m.title === b.moduleTitle);
        if (fromIdx < 0 || toIdx < 0) return prev;

        if (fromIdx === toIdx) {
          const list = [...prev[fromIdx].items];
          const oldIndex = list.findIndex((it) => it.label === a.label);
          if (oldIndex < 0) return prev;

          const newIndex =
            b.kind === "item"
              ? list.findIndex((it) => it.label === b.label)
              : list.length;

          const reordered = arrayMove(list, oldIndex, newIndex);
          const next = [...prev];
          next[fromIdx] = { ...next[fromIdx], items: reordered };
          return next;
        }

        const source = [...prev[fromIdx].items];
        const oldIndex = source.findIndex((it) => it.label === a.label);
        if (oldIndex < 0) return prev;

        const [moving] = source.splice(oldIndex, 1);
        const target = [...prev[toIdx].items];

        const insertAt =
          b.kind === "item"
            ? target.findIndex((it) => it.label === b.label)
            : target.length;

        const insertIndex = insertAt >= 0 ? insertAt : target.length;
        target.splice(insertIndex, 0, moving);

        const next = [...prev];
        next[fromIdx] = { ...next[fromIdx], items: source };
        next[toIdx] = { ...next[toIdx], items: target };
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-20 py-10 overflow-y-auto bg-white relative">
        <div className="max-w-4xl space-y-6">
          <h2 className="text-2xl font-semibold text-canvas-grayDark">Modules</h2>
          <p className="text-gray-600">Organize your course content into modules.</p>
          <div className="h-px bg-gray-200 my-6" />

          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {modules.length} module{modules.length !== 1 ? "s" : ""}
            </p>

            <button
              onClick={() => setShowAddModuleModal(true)}
              className="flex items-center gap-2 bg-[#008EE2] hover:bg-[#0079C2] text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Module
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVertical]}
          >
            <SortableContext
              items={modules.map((m) => modId(m.title))}
              strategy={verticalListSortingStrategy}
            >
              {modules.map((mod) => (
                <DraggableModuleShell
                  key={mod.title}
                  id={modId(mod.title)}
                  title={mod.title}
                  items={mod.items}
                  fadeOut={fadingModules.has(mod.title)}
                  onAddItem={handleAddItemToModule}
                  onEditItem={handleEditItemInModule}
                  onEditItemFull={handleEditItemInModuleFull}
                  onDeleteItem={handleDeleteItemInModule}
                  onEditModule={handleEditModule}
                  onDeleteModule={handleDeleteModule}
                  getItemId={(label) => itemId(mod.title, label)}
                  getContainerId={() => containerId(mod.title)}
                  dropIndex={
                    dropIndicator.moduleTitle === mod.title ? dropIndicator.index : null
                  }
                  moduleIsHighlighted={highlightModuleTitle === mod.title}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeMeta?.type === "module" && (
                <div className="rounded-xl bg-white/95 backdrop-blur-sm shadow-[0_10px_28px_rgba(0,0,0,0.28)] ring-2 ring-blue-300/40 p-4 w-[680px]">
                  <div className="text-sm font-semibold text-[#2D3B45] mb-1">
                    {activeMeta.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeMeta.count} item{activeMeta.count === 1 ? "" : "s"}
                  </div>
                </div>
              )}
              {activeMeta?.type === "item" && (
                <div className="px-6 py-3 rounded-md bg-white/95 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-blue-200">
                  <span className="text-gray-700 text-[15px] select-none">
                    {activeMeta.label}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {showAddModuleModal && (
          <AddModuleModal
            onClose={() => setShowAddModuleModal(false)}
            onAdd={handleAddModule}
          />
        )}
      </div>
    </div>
  );
}
