import { request } from "./http";

export interface CategoryRecord {
  id: number;
  name: string;
  description: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  description: string | null;
}

// Todas las categorías (o solo activas / inactivas).
export function getCategories(status?: 0 | 1) {
  const query = status === undefined ? "" : `?status=${status}`;
  return request<CategoryRecord[]>(`/categories${query}`);
}

export function createCategory(input: CategoryInput) {
  return request<{ message: string; id: number }>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: number, input: CategoryInput) {
  return request<{ message: string }>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateCategoryStatus(id: number, status: 0 | 1) {
  return request<{ message: string }>(`/categories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
