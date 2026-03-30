import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// Layouts & Guards
import AppLayout from "@/components/layouts/AppLayout";
import AuthLayout from "@/components/layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";

// --- LAZY LOAD PAGES ---
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));

// Dummy Dashboard for now
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Dashboard />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* 404 Catcher */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
