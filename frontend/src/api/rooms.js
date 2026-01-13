// frontend/src/api/rooms.js
// 专门放 “自习室 rooms” 相关接口调用

import { http } from "./http";

// 你后端是 /api/rooms
const BASE = "/api/rooms";

/**
 * 获取房间列表
 * GET /api/rooms
 */
export function listRooms() {
  return http.get(BASE);
}

/**
 * 创建房间
 * POST /api/rooms
 * body: { title, subject, description }
 */
export function createRoom(payload) {
  // payload 例如：
  // { title: "离散数学期末复习自习室", subject: "离散数学", description: "每天2个番茄钟..." }
  return http.post(BASE, payload);
}

/**
 * 可选：根据 id 获取单个房间
 * GET /api/rooms/{id}
 */
export function getRoom(id) {
  return http.get(`${BASE}/${id}`);
}

/**
 * 可选：删除房间
 * DELETE /api/rooms/{id}
 */
export function deleteRoom(id) {
  return http.del(`${BASE}/${id}`);
}

/**
 * 创建一次 pomodoro 记录
 * POST /api/rooms/{id}/pomodoros
 * body: { durationMinutes, result }
 */
export function createPomodoro(roomId, payload) {
  return http.post(`${BASE}/${roomId}/pomodoros`, payload);
}

/**
 * 获取 pomodoro 列表（默认后端返回最近 20 条）
 * GET /api/rooms/{id}/pomodoros
 */
export function listPomodoros(roomId) {
  return http.get(`${BASE}/${roomId}/pomodoros`);
}

/**
 * 获取 coins
 * GET /api/rooms/{id}/coins
 */
export function getCoins(roomId) {
  return http.get(`${BASE}/${roomId}/coins`);
}
