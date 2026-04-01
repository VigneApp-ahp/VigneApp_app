import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";

// 🔥 Lazy imports
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const Parcelles = lazy(() => import("@/pages/Parcelles/Parcelles"));
const Vendanges = lazy(() => import("@/pages/Vendanges/Vendanges"));
const Finance = lazy(() => import("@/pages/Finance/Finance"));
const Documents = lazy(() => import("@/pages/Documents/Documents"));
const Login = lazy(() => import("@/pages/Login/Login"));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Suspense global */}
      <Suspense fallback={<div>Chargement...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="parcelles" element={<Parcelles />} />
            <Route path="vendanges" element={<Vendanges />} />
            <Route path="finance" element={<Finance />} />
            <Route path="documents" element={<Documents />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
