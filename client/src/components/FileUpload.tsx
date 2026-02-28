import { useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { Model3D } from "@/types";

const ALLOWED_EXTENSIONS = [".stl", ".obj", ".3mf"];

interface FileUploadProps {
  model: Model3D | null;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function FileUpload({ model, onUpload, onDelete }: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(t("upload.invalidFormat", { formats: ALLOWED_EXTENSIONS.join(", ") }));
      return false;
    }
    return true;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;
      setProgress(0);
      try {
        await onUpload(file, setProgress);
        toast.success(t("upload.modelUploaded"));
      } catch {
        toast.error(t("upload.uploadFailed"));
      } finally {
        setProgress(null);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!confirm(t("upload.removeConfirm"))) return;
    try {
      await onDelete();
      toast.success(t("upload.modelRemoved"));
    } catch {
      toast.error(t("upload.removeFailed"));
    }
  };

  // Uploading state
  if (progress !== null) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium">{t("upload.uploading")}</p>
            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono">{progress}%</span>
        </div>
      </div>
    );
  }

  // Has model — show info
  if (model) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {model.original_name}
              </p>
              <p className="text-xs text-gray-400 uppercase">{model.format}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 hover:bg-primary-50 rounded transition"
            >
              {t("upload.replace")}
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded transition"
            >
              {t("upload.remove")}
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.3mf"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  // No model — upload zone
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition
        ${isDragging ? "border-primary-400 bg-primary-50" : "border-gray-200 hover:border-gray-300 bg-white"}
      `}
    >
      <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="mt-2 text-sm text-gray-500">
        <span className="font-medium text-primary-600">{t("upload.clickToUpload")}</span> {t("upload.orDragDrop")}
      </p>
      <p className="mt-1 text-xs text-gray-400">{t("upload.formats")}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.obj,.3mf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
