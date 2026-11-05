import { request } from "./http";
import type { SessionUser } from "../auth/session";

interface LoginResponse {
  message: string;
  token: string;
  user: SessionUser;
}

export function loginUser(email: string, password: string) {
  return request<LoginResponse>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false
  );
}
