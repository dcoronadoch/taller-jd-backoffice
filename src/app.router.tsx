import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./auth/pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./admin/layouts/AdminLayout";
import UsersPage from "./admin/pages/users/UsersPage";
import RolesPage from "./admin/pages/roles/RolesPage";
import PartsPage from "./admin/pages/parts/PartsPage";
import BrandsPage from "./admin/pages/brands/BrandsPage";
import CategoriesPage from "./admin/pages/categories/CategoriesPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />

        {/* Repuestos, marcas y categorías: ADMIN */}
        <Route
          path="/parts"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <PartsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/brands"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <BrandsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <CategoriesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Usuarios: exclusivamente ADMIN */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Roles: exclusivamente ADMIN */}
        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <RolesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
