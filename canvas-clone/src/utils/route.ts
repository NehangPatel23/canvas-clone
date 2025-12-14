import { useParams } from "react-router-dom";

/**
 * Enforces required route params at runtime and narrows types for TypeScript.
 */
export function useRequiredCourseId(): string {
  const { courseId } = useParams<{ courseId: string }>();

  if (!courseId) {
    throw new Error("Missing required route param: courseId");
  }

  return courseId;
}

export function useRequiredCourseAndFileIds(): {
  courseId: string;
  fileId: string;
} {
  const { courseId, fileId } = useParams<{
    courseId: string;
    fileId: string;
  }>();

  if (!courseId) throw new Error("Missing required route param: courseId");
  if (!fileId) throw new Error("Missing required route param: fileId");

  return { courseId, fileId };
}

export function useRequiredCourseAndPageIds(): {
  courseId: string;
  pageId: string;
} {
  const { courseId, pageId } = useParams<{
    courseId: string;
    pageId: string;
  }>();

  if (!courseId) throw new Error("Missing required route param: courseId");
  if (!pageId) throw new Error("Missing required route param: pageId");

  return { courseId, pageId };
}
