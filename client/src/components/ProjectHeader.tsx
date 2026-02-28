import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ProjectHeaderProps {
  name: string;
  client: string | null;
  contact: string | null;
  notes: string | null;
  onUpdate: (data: {
    name?: string;
    client?: string;
    contact?: string;
    notes?: string;
  }) => Promise<void>;
  onBack: () => void;
}

function EditableField({
  value,
  placeholder,
  onSave,
  className = "",
}: {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 transition ${className} ${!value ? "text-gray-300 italic" : ""}`}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      placeholder={placeholder}
      className={`bg-white border border-primary-300 rounded px-1 -mx-1 outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
    />
  );
}

export default function ProjectHeader({
  name,
  client,
  contact,
  notes,
  onUpdate,
  onBack,
}: ProjectHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Back button + title row */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title={t("header.backToProjects")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <EditableField
            value={name}
            placeholder={t("header.projectName")}
            onSave={(v) => onUpdate({ name: v })}
            className="text-xl font-bold text-gray-900"
          />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-6 ml-10 text-sm">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <EditableField
              value={client ?? ""}
              placeholder={t("header.client")}
              onSave={(v) => onUpdate({ client: v })}
              className="text-gray-600"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <EditableField
              value={contact ?? ""}
              placeholder={t("header.contact")}
              onSave={(v) => onUpdate({ contact: v })}
              className="text-gray-600"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <EditableField
              value={notes ?? ""}
              placeholder={t("header.notes")}
              onSave={(v) => onUpdate({ notes: v })}
              className="text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
