import { request } from "./http";

export interface RoleRecord {
  id: number;
  name: string;
  description: string | null;
  status: number;
}

// Todos los roles de la base de datos (solo administradores).
export function getRoles() {
  return request<RoleRecord[]>("/roles");
}
