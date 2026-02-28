import { useTranslation } from "react-i18next";
import { convertAndFormat } from "@/utils/currency";
import type { CalcResult as CalcResultType, CalcParams } from "@/types";

interface CalcResultProps {
  result: CalcResultType | null;
  isCalculating: boolean;
  params: CalcParams | null;
  hasModel: boolean;
  onCalculate: () => void;
}

function Row({
  label,
  value,
  currency,
  bold,
  accent,
}: {
  label: string;
  value: number;
  currency: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${accent ? "bg-primary-50 -mx-3 px-3 rounded-md" : ""}`}
    >
      <span className={`text-sm ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-gray-900" : accent ? "font-semibold text-primary-700" : "text-gray-800"}`}>
        {convertAndFormat(value, currency)}
      </span>
    </div>
  );
}

export default function CalcResultPanel({
  result,
  isCalculating,
  params,
  hasModel,
  onCalculate,
}: CalcResultProps) {
  const { t } = useTranslation();
  const currency = params?.currency ?? "USD";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {t("calc.title")}
        </h3>
        <button
          onClick={onCalculate}
          disabled={isCalculating || !hasModel}
          className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCalculating ? t("calc.calculating") : t("calc.calculate")}
        </button>
      </div>

      {!hasModel && (
        <p className="text-sm text-gray-400">{t("calc.uploadFirst")}</p>
      )}

      {hasModel && !result && !isCalculating && (
        <p className="text-sm text-gray-400">
          {t("calc.clickCalculate")}
        </p>
      )}

      {isCalculating && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
        </div>
      )}

      {result && !isCalculating && (
        <div className="space-y-1">
          {/* Physical */}
          <div className="pb-2 mb-1 border-b border-gray-100">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600">{t("calc.weight")}</span>
              <span className="text-sm font-mono text-gray-800">
                {result.weight.toFixed(1)} g
              </span>
            </div>
          </div>

          {/* Cost breakdown */}
          <Row label={t("calc.material")} value={result.material_cost} currency={currency} />
          <Row label={t("calc.energyCost")} value={result.energy_cost} currency={currency} />
          <Row label={t("calc.depreciationCost")} value={result.depreciation} currency={currency} />
          <Row label={t("calc.prepCost")} value={result.prep_cost} currency={currency} />
          <Row label={t("calc.rejectCost")} value={result.reject_cost} currency={currency} />

          <div className="border-t border-gray-200 mt-2 pt-2">
            <Row label={t("calc.unitCost")} value={result.unit_cost} currency={currency} bold />
          </div>

          <Row label={t("calc.profit")} value={result.profit} currency={currency} />
          <Row label={t("calc.tax")} value={result.tax} currency={currency} />

          <div className="border-t border-gray-200 mt-2 pt-2">
            <Row label={t("calc.pricePerUnit")} value={result.price_per_unit} currency={currency} bold />
          </div>

          {params && params.quantity > 1 && (
            <div className="text-xs text-gray-400 text-right">
              {t("calc.units", { count: params.quantity })}
            </div>
          )}

          <div className="mt-2 pt-2 border-t-2 border-primary-200">
            <Row label={t("calc.totalPrice")} value={result.total_price} currency={currency} bold accent />
          </div>
        </div>
      )}
    </div>
  );
}
