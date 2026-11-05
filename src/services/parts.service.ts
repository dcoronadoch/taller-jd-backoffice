import { request } from "./http";

export interface PartImage {
  id: number;
  part_id: number;
  url: string;
  is_primary: number;
  sort_order: number;
}

export interface PartRecord {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  brand_id: number;
  brand: string;
  category_id: number;
  category: string;
  status: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartDetail extends PartRecord {
  images: PartImage[];
}

// Datos que se envían al crear o editar (PUT reemplaza todos los campos).
export interface PartInput {
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  brand_id: number;
  category_id: number;
  status?: number;
}

export interface PartFilters {
  page: number;
  limit: number;
  search: string;
  brandId: string;
  categoryId: string;
  status: string;
}

export interface PaginatedParts {
  data: PartRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getParts(filters: PartFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.brandId) params.set("brand_id", filters.brandId);
  if (filters.categoryId) params.set("category_id", filters.categoryId);
  if (filters.status) params.set("status", filters.status);

  return request<PaginatedParts>(`/parts?${params.toString()}`);
}

export function getPart(id: number) {
  return request<PartDetail>(`/parts/${id}`);
}

export function createPart(input: PartInput) {
  return request<{ message: string; id: number }>("/parts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePart(id: number, input: PartInput) {
  return request<{ message: string }>(`/parts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updatePartStatus(id: number, status: 0 | 1) {
  return request<{ message: string }>(`/parts/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/* ------------------------------ Imágenes ------------------------------ */

export function addPartImage(
  partId: number,
  image: { url: string; is_primary: boolean; sort_order: number }
) {
  return request<{ message: string; id: number }>(`/parts/${partId}/images`, {
    method: "POST",
    body: JSON.stringify(image),
  });
}

export function setPrimaryImage(partId: number, imageId: number) {
  return request<{ message: string }>(`/parts/${partId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_primary: true }),
  });
}

export function deletePartImage(partId: number, imageId: number) {
  return request<{ message: string }>(`/parts/${partId}/images/${imageId}`, {
    method: "DELETE",
  });
}
