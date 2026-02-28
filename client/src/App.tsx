import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "14px" },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
