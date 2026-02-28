import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { email, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleLanguage = () => {
    const next = i18n.language === "ru" ? "en" : "ru";
    i18n.changeLanguage(next);
    localStorage.setItem("ui_language", next);
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            {t("nav.brand")}
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-xs font-medium px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition"
              title={t("common.language")}
            >
              {i18n.language === "ru" ? "EN" : "RU"}
            </button>
            <span className="text-sm text-gray-500">
              {email ?? ""}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
