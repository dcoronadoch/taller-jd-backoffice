import { request } from "./http";

export interface UserRecord {
  id: number;
  email: string;
  role_id: number;
  role: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: number;
  name: string;
  description: string | null;
}

export interface UserInput {
  email: string;
  password?: string;
  role_id?: number;
  status?: number;
}

export interface PaginatedUsers {
  data: UserRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getUsers(page = 1, limit = 10, search = "") {
  return request<PaginatedUsers>(
    `/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );
}

// Roles con los que se puede crear una cuenta (ADMIN y EMPLOYEE).
export function getUserRoles() {
  return request<UserRole[]>("/users/roles");
}

export function createUser(input: UserInput) {
  return request<{ message: string; id: number }>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: number, input: UserInput) {
  return request<{ message: string }>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateUserStatus(id: number, status: 0 | 1) {
  return request<{ message: string }>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
