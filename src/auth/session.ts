// Manejo de la sesión del Backoffice (token y usuario en localStorage).

export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

// Roles que pueden entrar al Backoffice. Cuando existan más módulos
// (repuestos, pedidos...) se puede agregar "EMPLOYEE".
export const BACKOFFICE_ROLES = ["ADMIN"];

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SessionUser>;

    if (
      typeof parsed.id !== "number" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role.trim().toUpperCase(),
    };
  } catch {
    return null;
  }
}

// El token del backend dura 2 horas: se revisa su fecha de expiración.
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };

    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();

  if (!token || !getUser()) return false;

  if (isTokenExpired(token)) {
    clearSession();
    return false;
  }

  return true;
}

export function hasRole(...roles: string[]): boolean {
  const role = getUser()?.role ?? "";
  return roles.some((allowed) => allowed.toUpperCase() === role);
}

export function roleLabel(role: string): string {
  switch (role.trim().toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "EMPLOYEE":
      return "Empleado";
    case "CUSTOMER":
      return "Cliente";
    default:
      return role;
  }
}
