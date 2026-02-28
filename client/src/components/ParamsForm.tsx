import { useEffect, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CalcParams } from "@/types";

interface ParamsFormProps {
  params: CalcParams | null;
  onUpdate: (data: Partial<CalcParams>) => Promise<void>;
  onFetchParams: () => Promise<CalcParams>;
  hasModel: boolean;
}

type FieldConfig = {
  key: keyof CalcParams;
  labelKey: string;
  type: "number" | "select" | "toggle";
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  options?: { value: string; labelKey?: string; label?: string }[];
};

const SECTIONS: { titleKey: string; fields: FieldConfig[] }[] = [
  {
    titleKey: "params.sectionTechnology",
    fields: [
      {
        key: "technology",
        labelKey: "params.technology",
        type: "select",
        options: [
          { value: "FDM", label: "FDM" },
          { value: "SLA", label: "SLA" },
          { value: "Metal", label: "Metal" },
        ],
      },
    ],
  },
  {
    titleKey: "params.sectionMaterial",
    fields: [
      { key: "material_density", labelKey: "params.density", type: "number", step: 0.01, min: 0, unit: "g/cm³" },
      { key: "material_price", labelKey: "params.price", type: "number", step: 0.5, min: 0, unit: "/kg" },
      { key: "waste_factor", labelKey: "params.wasteFactor", type: "number", step: 0.01, min: 1, unit: "×" },
    ],
  },
  {
    titleKey: "params.sectionPrint",
    fields: [
      { key: "infill", labelKey: "params.infill", type: "number", step: 5, min: 0, max: 100, unit: "%" },
      { key: "support_percent", labelKey: "params.support", type: "number", step: 5, min: 0, max: 100, unit: "%" },
      { key: "print_time_h", labelKey: "params.printTime", type: "number", step: 0.5, min: 0, unit: "h" },
      { key: "post_process_time_h", labelKey: "params.postProcessing", type: "number", step: 0.25, min: 0, unit: "h" },
      { key: "modeling_time_h", labelKey: "params.modelingTime", type: "number", step: 0.25, min: 0, unit: "h" },
    ],
  },
  {
    titleKey: "params.sectionEconomics",
    fields: [
      { key: "quantity", labelKey: "params.quantity", type: "number", step: 1, min: 1 },
      { key: "markup", labelKey: "params.markup", type: "number", step: 0.1, min: 1, unit: "×" },
      { key: "reject_rate", labelKey: "params.rejectRate", type: "number", step: 0.01, min: 0, max: 1, unit: "%" },
      { key: "tax_rate", labelKey: "params.taxRate", type: "number", step: 0.01, min: 0, max: 1, unit: "%" },
      { key: "depreciation_rate", labelKey: "params.depreciation", type: "number", step: 0.5, min: 0, unit: "/h" },
      { key: "energy_rate", labelKey: "params.energy", type: "number", step: 0.05, min: 0, unit: "/h" },
      { key: "hourly_rate", labelKey: "params.laborRate", type: "number", step: 1, min: 0, unit: "/h" },
    ],
  },
  {
    titleKey: "params.sectionDisplay",
    fields: [
      {
        key: "currency",
        labelKey: "params.currency",
        type: "select",
        options: [
          { value: "USD", label: "USD ($)" },
          { value: "EUR", label: "EUR (€)" },
          { value: "RUB", label: "RUB (₽)" },
          { value: "KZT", label: "KZT (₸)" },
        ],
      },
      {
        key: "language",
        labelKey: "params.language",
        type: "select",
        options: [
          { value: "en", label: "English" },
          { value: "ru", label: "Русский" },
        ],
      },
    ],
  },
];

export default function ParamsForm({
  params,
  onUpdate,
  onFetchParams,
  hasModel,
}: ParamsFormProps) {
  const { t, i18n } = useTranslation();
  const [localParams, setLocalParams] = useState<CalcParams | null>(params);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync from prop
  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Fetch params on mount if missing
  useEffect(() => {
    if (!params && hasModel) {
      onFetchParams();
    }
  }, [params, hasModel, onFetchParams]);

  const handleChange = useCallback(
    (key: keyof CalcParams, value: string | number | boolean) => {
      if (!localParams) return;

      const updated = { ...localParams, [key]: value };
      setLocalParams(updated);

      // Sync language dropdown with i18n
      if (key === "language" && typeof value === "string") {
        i18n.changeLanguage(value);
      }

      // Debounced save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate({ [key]: value } as Partial<CalcParams>);
      }, 500);
    },
    [localParams, onUpdate, i18n]
  );

  if (!localParams) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t("params.title")}</h3>
        <p className="text-sm text-gray-400">{t("params.uploadFirst")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t("params.title")}</h3>

      {SECTIONS.map((section) => (
        <div key={section.titleKey}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t(section.titleKey)}
          </h4>
          <div className="space-y-2">
            {section.fields.map((field) => {
              const value = localParams[field.key];

              if (field.type === "select") {
                return (
                  <div key={field.key} className="flex items-center justify-between gap-2">
                    <label className="text-sm text-gray-600 flex-shrink-0">{t(field.labelKey)}</label>
                    <select
                      value={value as string}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none w-28"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.labelKey ? t(opt.labelKey) : opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={field.key} className="flex items-center justify-between gap-2">
                  <label className="text-sm text-gray-600 flex-shrink-0">{t(field.labelKey)}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={value as number}
                      onChange={(e) => {
                        const v = field.key === "quantity" ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0;
                        handleChange(field.key, v);
                      }}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1.5 w-24 text-right focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    {field.unit && (
                      <span className="text-xs text-gray-400 w-8">{field.unit}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
