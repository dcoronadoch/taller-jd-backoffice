import { API_URL } from "../config/api";
import { clearSession, getToken } from "../auth/session";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Envía una solicitud JSON al backend. Si la sesión expiró (401),
// la limpia y redirige al inicio de sesión.
export async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true
): Promise<T> {
  const token = authenticated ? getToken() : null;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.",
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSession();
      window.location.replace("/login");
    }

    throw new ApiError(
      data?.message || "No fue posible completar la solicitud.",
      response.status
    );
  }

  return data as T;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
