import { create } from "zustand";
import api from "@/api/client";
import type { ProjectListItem, ProjectCreate } from "@/types";

interface ProjectsState {
  projects: ProjectListItem[];
  isLoading: boolean;

  fetchProjects: () => Promise<void>;
  createProject: (data: ProjectCreate) => Promise<ProjectListItem>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/projects");
      set({ projects: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    const res = await api.post("/projects", data);
    const newProject = res.data;
    // Re-fetch to get the list item format
    await get().fetchProjects();
    return newProject;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}));
