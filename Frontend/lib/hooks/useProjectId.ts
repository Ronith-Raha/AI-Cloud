import { useEffect, useState } from "react";
import { createProject, listProjects } from "@/lib/api/client";

const STORAGE_KEY = "nexus_project_id";

async function ensureProjectId() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const list = await listProjects();
      const exists = list.projects.some((project) => project.id === stored);
      if (exists) {
        return stored;
      }
    } catch {
      // ignore list failure and fallback to stored
      return stored;
    }
  }

  try {
    const list = await listProjects();
    if (list.projects.length > 0) {
      const projectId = list.projects[0].id;
      window.localStorage.setItem(STORAGE_KEY, projectId);
      return projectId;
    }
  } catch {
    // Ignore listing errors and try creating a project
  }

  const created = await createProject("Local Project");
  window.localStorage.setItem(STORAGE_KEY, created.projectId);
  return created.projectId;
}

export function useProjectId() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    ensureProjectId()
      .then((id) => {
        if (!isActive) return;
        setProjectId(id);
        setError(null);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load project");
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { projectId, loading, error };
}

