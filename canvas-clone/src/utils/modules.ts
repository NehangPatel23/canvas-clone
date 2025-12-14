// Shared module/page utilities used by Modules and Pages sections.

export type Item = {
  type: string;
  label: string;
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
      {
        type: "page",
        label: "Course Overview",
        pageId: "course-overview",
      },
      { type: "file", label: "Syllabus.pdf" },
    ],
  },
  {
    title: "Week 2 – Algorithms and Complexity",
    items: [
      {
        type: "page",
        label: "Lecture Slides",
        pageId: "lecture-slides",
      },
      { type: "file", label: "ExampleProblems.docx" },
      {
        type: "link",
        label: "Supplementary Reading",
        url: "https://example.com",
      },
    ],
  },
];

export function normalizeModules(modules: ModuleT[]): ModuleT[] {
  return modules.map((m) => ({
    ...m,
    items: m.items.map((it) =>
      it.type === "page"
        ? { ...it, pageId: it.pageId ?? slugifyLabel(it.label) }
        : it
    ),
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
