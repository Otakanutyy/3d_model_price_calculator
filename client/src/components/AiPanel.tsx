import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { AiText } from "@/types";
import api from "@/api/client";

interface AiPanelProps {
  projectId: string;
  aiText: AiText | null;
  hasCalcResult: boolean;
  onAiTextUpdate: (aiText: AiText) => void;
}

export default function AiPanel({
  projectId,
  aiText,
  hasCalcResult,
  onAiTextUpdate,
}: AiPanelProps) {
  const { t, i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const lang = i18n.language?.startsWith("ru") ? "ru" : "en";

  // Pick the right language text
  const description =
    (lang === "ru" ? aiText?.description_ru : aiText?.description_en) ||
    aiText?.description ||
    null;
  const commercialText =
    (lang === "ru" ? aiText?.commercial_text_ru : aiText?.commercial_text_en) ||
    aiText?.commercial_text ||
    null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post(`/projects/${projectId}/ai-generate`);
      onAiTextUpdate(res.data);
      toast.success(t("ai.generated"));
    } catch {
      toast.error(t("ai.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {t("ai.title")}
        </h3>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !hasCalcResult}
          className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              {t("ai.generating")}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {aiText ? t("ai.regenerate") : t("ai.generate")}
            </>
          )}
        </button>
      </div>

      {!hasCalcResult && (
        <p className="text-sm text-gray-400">{t("ai.needCalcFirst")}</p>
      )}

      {hasCalcResult && !aiText && !isGenerating && (
        <p className="text-sm text-gray-400">{t("ai.noText")}</p>
      )}

      {isGenerating && !aiText && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent mx-auto" />
            <p className="mt-3 text-xs text-gray-500">{t("ai.generating")}</p>
          </div>
        </div>
      )}

      {aiText && (
        <div className="space-y-4">
          {/* Language indicator */}
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {lang === "ru" ? "Русский" : "English"}
          </div>

          {/* Technical Description */}
          {description && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                {t("ai.description")}
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed border border-gray-100">
                {description}
              </div>
            </div>
          )}

          {/* Commercial Text */}
          {commercialText && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                {t("ai.commercialText")}
              </h4>
              <div className="bg-violet-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed border border-violet-100">
                {commercialText}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {new Date(aiText.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
