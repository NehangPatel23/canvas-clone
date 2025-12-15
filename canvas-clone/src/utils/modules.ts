// Shared module/page utilities used by Modules and Pages sections.

// NOTE: We intentionally keep `type: string` for backwards compatibility with
// any already-persisted localStorage values, but the UI now also supports a
// "section" item type for Canvas-like module section headers.
export type Item = {
  type: string; // "page" | "file" | "link" | "section" (and any legacy values)
  label: string;

  // Canvas-like indentation within the module list.
  // 0 = no indent, 1..3 = increasing indent.
  indent?: number;

  // Only meaningful for type === "section".
  // When true, items “under” this section are hidden in the UI.
  collapsed?: boolean;

  url?: string;
  pageId?: string;
  fileId?: string;
  fileName?: string;
};

export type ModuleT = {
  title: string;
  items: Item[];
};

export const MODULES_STORAGE_KEY = "canvasClone:modules";

export const slugifyLabel = (label: string) =>
  encodeURIComponent(label.toLowerCase().trim().replace(/\s+/g, "-"));

// Default modules (used on very first load)
export const DEFAULT_MODULES: ModuleT[] = [
  {
    title: "Week 1 – Introduction",
    items: [
      { type: "section", label: "Start Here", indent: 0, collapsed: false },
      {
        type: "page",
        label: "Course Overview",
        pageId: "course-overview",
        indent: 1,
      },
      { type: "file", label: "Syllabus.pdf", indent: 1 },
    ],
  },
  {
    title: "Week 2 – Algorithms and Complexity",
    items: [
      {
        type: "section",
        label: "Learning Materials",
        indent: 0,
        collapsed: false,
      },
      {
        type: "page",
        label: "Lecture Slides",
        pageId: "lecture-slides",
        indent: 1,
      },
      { type: "file", label: "ExampleProblems.docx", indent: 1 },
      {
        type: "link",
        label: "Supplementary Reading",
        url: "https://example.com",
        indent: 1,
      },
    ],
  },
];

function clampIndent(n: unknown) {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, Math.min(3, v));
}

export function normalizeModules(modules: ModuleT[]): ModuleT[] {
  return modules.map((m) => ({
    ...m,
    items: m.items.map((it) => {
      const indent = clampIndent((it as any).indent);
      const collapsed =
        it.type === "section" ? !!(it as any).collapsed : undefined;

      if (it.type === "page") {
        return {
          ...it,
          indent,
          pageId: it.pageId ?? slugifyLabel(it.label),
        };
      }

      if (it.type === "section") {
        return {
          ...it,
          indent,
          collapsed,
        };
      }

      return { ...it, indent };
    }),
  }));
}

export function loadModulesFromStorage(): ModuleT[] {
  try {
    const raw = window.localStorage.getItem(MODULES_STORAGE_KEY);
    if (!raw) return DEFAULT_MODULES;
    const parsed = JSON.parse(raw) as ModuleT[];
    return normalizeModules(parsed);
  } catch {
    return DEFAULT_MODULES;
  }
}

export function saveModulesToStorage(modules: ModuleT[]) {
  try {
    window.localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save modules to localStorage", err);
  }
}

export function extractPageItems(modules: ModuleT[]) {
  return modules
    .flatMap((m) =>
      m.items
        .filter((it) => it.type === "page")
        .map((it) => ({
          moduleTitle: m.title,
          label: it.label,
          pageId: it.pageId ?? slugifyLabel(it.label),
        }))
    )
    .filter((p) => !!p.pageId);
}
