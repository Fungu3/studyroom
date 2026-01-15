// frontend/src/api/system.js
import { http } from "./http";

export function health() {
  return http.get("/health");
}

export function register(data) {
    return http.post("/api/auth/register", data);
}

export function login(data) {
    return http.post("/api/auth/login", data);
}

export function getUserInfo(id) {
    return http.get(`/api/auth/me/${id}`);
}

