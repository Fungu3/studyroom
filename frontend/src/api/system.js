// frontend/src/api/system.js
import { http } from "./http";

// 健康检查：GET /health
export function health() {
  return http.get("/health");
}
