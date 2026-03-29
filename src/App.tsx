import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Parcelles from "@/pages/Parcelles/Parcelles";
import Vendanges from "@/pages/Vendanges/Vendanges";
import Finance from "@/pages/Finance/Finance";
import Documents from "@/pages/Documents/Documents";
import Login from "@/pages/Login/Login";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
