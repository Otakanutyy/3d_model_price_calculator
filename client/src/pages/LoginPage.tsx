import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/projects");
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.detail || t("auth.loginFailed")
          : t("auth.loginFailed");
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("auth.title")}
          </h1>
          <p className="mt-2 text-gray-500">{t("auth.loginSubtitle")}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder={t("auth.emailPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t("auth.signingIn") : t("auth.signIn")}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("auth.register")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
