import { create } from "zustand";
import api from "@/api/client";
import type { ProjectDetail, CalcParams, CalcResult } from "@/types";

interface ProjectDetailState {
  project: ProjectDetail | null;
  isLoading: boolean;
  isSavingParams: boolean;
  isCalculating: boolean;

  fetchProject: (id: string) => Promise<void>;
  updateProject: (
    id: string,
    data: Partial<Pick<ProjectDetail, "name" | "client" | "contact" | "notes">>
  ) => Promise<void>;
  uploadModel: (
    id: string,
    file: File,
    onProgress?: (pct: number) => void
  ) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  pollModelStatus: (id: string) => Promise<void>;
  fetchParams: (id: string) => Promise<CalcParams>;
  updateParams: (id: string, data: Partial<CalcParams>) => Promise<void>;
  runCalculation: (id: string) => Promise<CalcResult>;
  reset: () => void;
}

export const useProjectDetailStore = create<ProjectDetailState>((set, get) => ({
  project: null,
  isLoading: false,
  isSavingParams: false,
  isCalculating: false,

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/projects/${id}`);
      set({ project: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Failed to load project");
    }
  },

  updateProject: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    set({ project: res.data });
  },

  uploadModel: async (id, file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/projects/${id}/model`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    const proj = get().project;
    if (proj) {
      set({ project: { ...proj, model: res.data } });
    }
  },

  deleteModel: async (id) => {
    await api.delete(`/projects/${id}/model`);
    const proj = get().project;
    if (proj) {
      set({ project: { ...proj, model: null, calc_result: null } });
    }
  },

  pollModelStatus: async (id) => {
    const poll = async (): Promise<void> => {
      const res = await api.get(`/projects/${id}/model/status`);
      const model = res.data;
      const proj = get().project;
      if (proj) {
        set({ project: { ...proj, model } });
      }
      if (model.status === "queued" || model.status === "processing") {
        await new Promise((r) => setTimeout(r, 1500));
        return poll();
      }
    };
    await poll();
  },

  fetchParams: async (id) => {
    const res = await api.get(`/projects/${id}/params`);
    const proj = get().project;
    if (proj) {
      set({ project: { ...proj, calc_params: res.data } });
    }
    return res.data;
  },

  updateParams: async (id, data) => {
    set({ isSavingParams: true });
    try {
      const res = await api.patch(`/projects/${id}/params`, data);
      const proj = get().project;
      if (proj) {
        set({ project: { ...proj, calc_params: res.data } });
      }
    } finally {
      set({ isSavingParams: false });
    }
  },

  runCalculation: async (id) => {
    set({ isCalculating: true });
    try {
      const res = await api.get(`/projects/${id}/calculation`);
      const proj = get().project;
      if (proj) {
        set({ project: { ...proj, calc_result: res.data } });
      }
      return res.data;
    } finally {
      set({ isCalculating: false });
    }
  },

  reset: () => {
    set({
      project: null,
      isLoading: false,
      isSavingParams: false,
      isCalculating: false,
    });
  },
}));
