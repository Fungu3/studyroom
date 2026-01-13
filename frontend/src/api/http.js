// frontend/src/api/http.js
// 一个很轻量的 fetch 封装：统一 baseURL、JSON 解析、错误处理

const BASE_URL = "";
// 为空表示“同域”，配合 Vite proxy：/api 会被转发到 http://localhost:8080/api

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const headers = {
    ...(options.headers || {}),
  };

  // 如果 body 是普通对象，则自动转成 JSON，并加上 Content-Type
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    body = JSON.stringify(body);
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    body,
  });

  // 先尝试解析 JSON；如果不是 JSON，就返回文本
  const contentType = resp.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await resp.json().catch(() => null);
  } else {
    data = await resp.text().catch(() => null);
  }

  if (!resp.ok) {
    // 统一抛出错误对象，便于前端提示
    const message =
      (data && data.message) ||
      (typeof data === "string" ? data : "") ||
      `Request failed: ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const http = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};
