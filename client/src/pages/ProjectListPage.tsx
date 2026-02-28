import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjectsStore } from "@/store/projectsStore";
import toast from "react-hot-toast";
import type { ProjectListItem } from "@/types";

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    done: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    queued: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function ProjectCard({
  project,
  onDelete,
  onClick,
}: {
  project: ProjectListItem;
  onDelete: () => void;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("projects.deleteConfirm"))) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {project.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {project.client && (
              <span className="text-sm text-gray-500">{project.client}</span>
            )}
            {project.has_model && (
              <StatusBadge status={project.model_status} />
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
          title="Delete project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        {t("projects.updated", { date: new Date(project.updated_at).toLocaleDateString() })}
      </div>
    </div>
  );
}

function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, client: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), client.trim());
    setName("");
    setClient("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("createModal.title")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("createModal.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder={t("createModal.namePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("createModal.clientLabel")}
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder={t("createModal.clientPlaceholder")}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition"
            >
              {t("createModal.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition"
            >
              {t("createModal.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectListPage() {
  const { t } = useTranslation();
  const { projects, isLoading, fetchProjects, createProject, deleteProject } =
    useProjectsStore();
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (name: string, client: string) => {
    try {
      const project = await createProject({
        name,
        client: client || undefined,
      });
      toast.success(t("projects.projectCreated"));
      navigate(`/projects/${project.id}`);
    } catch {
      toast.error(t("projects.createFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success(t("projects.projectDeleted"));
    } catch {
      toast.error(t("projects.deleteFailed"));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("projects.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("projects.count", { count: projects.length })}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("projects.newProject")}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("projects.noProjects")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("projects.noProjectsHint")}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition"
          >
            {t("projects.createProject")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => handleDelete(project.id)}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
