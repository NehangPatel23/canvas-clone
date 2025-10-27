import { useState } from "react";
import CourseHeader from "../components/CourseHeader";
import ModuleItem from "../components/ModuleItem";
import AddModuleModal from "../components/AddModuleModal";
import { Plus } from "lucide-react";

type Item = { type: string; label: string };
type Module = { title: string; items: Item[] };

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([
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
        { type: "link", label: "Supplementary Reading" },
      ],
    },
  ]);

  // modules currently in "fading out" state
  const [fadingModules, setFadingModules] = useState<Set<string>>(new Set());

  const [showAddModuleModal, setShowAddModuleModal] = useState(false);

  // --- MODULE OPS ---

  const handleAddModule = (newModuleTitle: string) => {
    const newModule: Module = { title: newModuleTitle, items: [] };
    setModules((prev) => [...prev, newModule]);
    setShowAddModuleModal(false);
  };

  const handleEditModule = (oldTitle: string, newTitle: string) => {
    setModules((prevModules) =>
      prevModules.map((m) =>
        m.title === oldTitle ? { ...m, title: newTitle } : m
      )
    );
  };

  // IMPORTANT: fade first, then actually remove the module from state
  const handleDeleteModule = (titleToDelete: string) => {
    // mark this module as fading
    setFadingModules((prev) => new Set([...prev, titleToDelete]));

    // after the fade animation finishes, remove it
    setTimeout(() => {
      setModules((prev) =>
        prev.filter((m) => m.title !== titleToDelete)
      );

      // cleanup fading state
      setFadingModules((prev) => {
        const next = new Set(prev);
        next.delete(titleToDelete);
        return next;
      });
    }, 250); // slightly > .animate-shrinkFade (200ms)
  };

  // --- ITEM OPS ---

  const handleAddItemToModule = (
    moduleTitle: string,
    newItem: { type: string; label: string }
  ) => {
    setModules((prevModules) =>
      prevModules.map((m) =>
        m.title === moduleTitle
          ? { ...m, items: [...m.items, newItem] }
          : m
      )
    );
  };

  const handleEditItemInModule = (
    moduleTitle: string,
    oldLabel: string,
    newLabel: string
  ) => {
    setModules((prevModules) =>
      prevModules.map((m) =>
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

  // immediate removal after ModuleItem tells us to delete that row
  const handleDeleteItemInModule = (
    moduleTitle: string,
    labelToRemove: string
  ) => {
    setModules((prevModules) =>
      prevModules.map((m) =>
        m.title === moduleTitle
          ? {
              ...m,
              items: m.items.filter(
                (it) => it.label !== labelToRemove
              ),
            }
          : m
      )
    );
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white relative">
        <div className="max-w-4xl space-y-6">
          {/* Page header */}
          <h2 className="text-2xl font-semibold text-canvas-grayDark">
            Modules
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Organize your course content into modules.
          </p>

          <div className="h-px bg-gray-200 my-6"></div>

          {/* Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {modules.length} module
              {modules.length !== 1 ? "s" : ""}
            </p>

            <button
              onClick={() => setShowAddModuleModal(true)}
              className="flex items-center gap-2 bg-[#008EE2] hover:bg-[#0079C2] text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Module
            </button>
          </div>

          {/* Module list */}
          <div className="space-y-4 pt-4">
            {modules.map((mod) => (
              <ModuleItem
                key={mod.title}
                title={mod.title}
                items={mod.items}
                fadeOut={fadingModules.has(mod.title)} // tells ModuleItem to animate
                onAddItem={handleAddItemToModule}
                onEditItem={handleEditItemInModule}
                onDeleteItem={handleDeleteItemInModule}
                onEditModule={handleEditModule}
                onDeleteModule={handleDeleteModule}
              />
            ))}
          </div>
        </div>

        {/* Add Module modal */}
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
