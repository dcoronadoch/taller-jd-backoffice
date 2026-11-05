import { request } from "./http";

export interface BrandRecord {
  id: number;
  name: string;
  status: number;
  created_at: string;
  updated_at: string;
}

// Todas las marcas (o solo activas / inactivas).
export function getBrands(status?: 0 | 1) {
  const query = status === undefined ? "" : `?status=${status}`;
  return request<BrandRecord[]>(`/brands${query}`);
}

export function createBrand(name: string) {
  return request<{ message: string; id: number }>("/brands", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateBrand(id: number, name: string) {
  return request<{ message: string }>(`/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function updateBrandStatus(id: number, status: 0 | 1) {
  return request<{ message: string }>(`/brands/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
