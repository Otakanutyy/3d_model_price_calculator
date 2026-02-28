import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useProjectDetailStore } from "@/store/projectDetailStore";
import type { AiText } from "@/types";
import ProjectHeader from "@/components/ProjectHeader";
import Viewer3D from "@/components/Viewer3D";
import FileUpload from "@/components/FileUpload";
import ParamsForm from "@/components/ParamsForm";
import CalcResultPanel from "@/components/CalcResult";
import AiPanel from "@/components/AiPanel";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    project,
    isLoading,
    isCalculating,
    fetchProject,
    updateProject,
    uploadModel,
    deleteModel,
    pollModelStatus,
    fetchParams,
    updateParams,
    runCalculation,
    reset,
  } = useProjectDetailStore();

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchProject(id).catch(() => toast.error(t("detail.loadFailed")));
    }
    return () => reset();
  }, [id]);

  // Poll model when status is pending
  useEffect(() => {
    if (
      id &&
      project?.model &&
      (project.model.status === "queued" || project.model.status === "processing")
    ) {
      pollModelStatus(id).catch(() => {});
    }
  }, [id, project?.model?.status]);

  // Auto-fetch params when model is done and no params yet
  useEffect(() => {
    if (id && project?.model?.status === "done" && !project.calc_params) {
      fetchParams(id).catch(() => {});
    }
  }, [id, project?.model?.status, project?.calc_params]);

  const handleUpdate = useCallback(
    async (data: { name?: string; client?: string; contact?: string; notes?: string }) => {
      if (!id) return;
      try {
        await updateProject(id, data);
      } catch {
        toast.error(t("detail.updateFailed"));
      }
    },
    [id, updateProject]
  );

  const handleUpload = useCallback(
    async (file: File, onProgress: (pct: number) => void) => {
      if (!id) return;
      await uploadModel(id, file, onProgress);
      // Start polling after upload
      pollModelStatus(id).catch(() => {});
    },
    [id, uploadModel, pollModelStatus]
  );

  const handleDeleteModel = useCallback(async () => {
    if (!id) return;
    await deleteModel(id);
  }, [id, deleteModel]);

  const handleUpdateParams = useCallback(
    async (data: Partial<any>) => {
      if (!id) return;
      await updateParams(id, data);
    },
    [id, updateParams]
  );

  const handleFetchParams = useCallback(async () => {
    if (!id) throw new Error("No id");
    return fetchParams(id);
  }, [id, fetchParams]);

  const handleCalculate = useCallback(async () => {
    if (!id) return;
    try {
      await runCalculation(id);
      toast.success(t("calc.calcComplete"));
    } catch {
      toast.error(t("calc.calcFailed"));
    }
  }, [id, runCalculation]);

  const handleAiTextUpdate = useCallback(
    (aiText: Partial<AiText> & { description_en?: string | null; description_ru?: string | null; commercial_text_en?: string | null; commercial_text_ru?: string | null }) => {
      useProjectDetailStore.setState((state) => ({
        project: state.project
          ? {
              ...state.project,
              ai_text: {
                id: aiText.id ?? state.project.ai_text?.id ?? "",
                description: aiText.description ?? null,
                commercial_text: aiText.commercial_text ?? null,
                description_en: aiText.description_en ?? null,
                description_ru: aiText.description_ru ?? null,
                commercial_text_en: aiText.commercial_text_en ?? null,
                commercial_text_ru: aiText.commercial_text_ru ?? null,
                created_at: aiText.created_at ?? new Date().toISOString(),
              },
            }
          : null,
      }));
    },
    []
  );

  // Loading skeleton
  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const hasModel = project.model?.status === "done";
  const hasCalcResult = !!project.calc_result;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <ProjectHeader
        name={project.name}
        client={project.client}
        contact={project.contact}
        notes={project.notes}
        onUpdate={handleUpdate}
        onBack={() => navigate("/projects")}
      />

      {/* Main layout */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6 h-full">
            {/* Left — Params */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <ParamsForm
                params={project.calc_params}
                onUpdate={handleUpdateParams}
                onFetchParams={handleFetchParams}
                hasModel={hasModel}
              />
            </div>

            {/* Center — Viewer + Upload */}
            <div className="flex flex-col gap-4">
              <FileUpload
                model={project.model}
                onUpload={handleUpload}
                onDelete={handleDeleteModel}
              />
              <div className="flex-1 min-h-[400px]">
                <Viewer3D model={project.model} projectId={project.id} />
              </div>
            </div>

            {/* Right — Calculation + AI */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <CalcResultPanel
                  result={project.calc_result}
                  isCalculating={isCalculating}
                  params={project.calc_params}
                  hasModel={hasModel}
                  onCalculate={handleCalculate}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <AiPanel
                  projectId={project.id}
                  aiText={project.ai_text}
                  hasCalcResult={hasCalcResult}
                  onAiTextUpdate={handleAiTextUpdate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
