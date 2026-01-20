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

export function listPomodoros(roomId) {
  return http.get(`${BASE}/${roomId}/pomodoros`);
}

export function getCoins(roomId) {
    return http.get(`${BASE}/${roomId}/coins`);
}

// --- Notes ---

export function listNotes(roomId) {
    return http.get(`${BASE}/${roomId}/notes`);
}

export function createNote(roomId, payload) {
    return http.post(`${BASE}/${roomId}/notes`, payload);
}

// 收藏 (1收藏=1金币 to publisher)
export function collectNote(roomId, noteId, userId) {
    return http.post(`${BASE}/${roomId}/notes/${noteId}/collect?userId=${userId}`);
}

export function addNoteComment(roomId, noteId, payload) {
    return http.post(`${BASE}/${roomId}/notes/${noteId}/comments`, payload);
}

export function likeNoteComment(roomId, commentId, userId) {
    return http.post(`${BASE}/${roomId}/notes/comments/${commentId}/like?userId=${userId}`);
}
