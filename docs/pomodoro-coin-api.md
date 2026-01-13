# 线路2：Pomodoro & Coins — 接口与类设计 🎯

## 概要
本文件用于向组员下发线路2（后端数据闭环）的接口契约与后端实现建议，目标做到最小可演示的 **端到端闭环**：详情接口（GET）、番茄记录（POST）、以及完成一次番茄钟后发放虚拟币（MVP）。

---

## 快速列表（Endpoints）
- **GET**  /api/rooms/{id}  — 获取房间详情（已有实现或补齐）
- **POST** /api/rooms/{id}/pomodoros  — 创建一次 pomodoro（记录）
- **GET**  /api/rooms/{id}/pomodoros  — （可选）查询房间下的 pomodoro 列表
- **GET**  /api/rooms/{id}/coins      — （MVP）查询房间累计 coins 或最新变动

---

## 接口契约（示例）

### GET /api/rooms/{id}
- 200 OK
```
{ "id": 1, "title": "早读房", "subject": "背单词", "description": "...", "createdAt": "2026-01-01T10:00:00" }
```
- 404 Not Found
```
{ "code": "ROOM_NOT_FOUND", "message": "room 1 not found" }
```

---

### POST /api/rooms/{id}/pomodoros
- 请求 body (JSON)
```
{
  "durationMinutes": 25,
  "result": "SUCCESS"   // "SUCCESS" | "FAIL"
}
```
- 成功响应 201 Created
```
{
  "id": 123,
  "roomId": 1,
  "durationMinutes": 25,
  "result": "SUCCESS",
  "createdAt": "2026-01-13T12:00:00",
  "awardedCoins": 5
}
```
- 验证错误 400
```
{ "code": "INVALID_PAYLOAD", "message": "durationMinutes must be >0" }
```

---

### GET /api/rooms/{id}/pomodoros  （可选）
- 支持分页 & 默认返回最近 20 条
- 响应示例
```
[{ "id": 123, "durationMinutes":25, "result":"SUCCESS","createdAt":"...","awardedCoins":5 }, ...]
```

---

### GET /api/rooms/{id}/coins  （MVP）
- 200 OK
```
{ "roomId":1, "totalCoins": 42, "lastTransactionAt": "2026-01-13T12:00:00" }
```

---

## Java 类与方法建议（签名级）

> 包名建议：`com.studyroom.controller` / `service` / `repository` / `dto` / `entity`

### DTOs（示例）
- `CreatePomodoroRequest {
    Integer durationMinutes; 
    PomodoroResult result; // enum
  }`

- `PomodoroResponse { Long id; Long roomId; Integer durationMinutes; PomodoroResult result; Instant createdAt; Integer awardedCoins; }`

- `CoinsResponse { Long roomId; Long totalCoins; Instant lastTransactionAt; }`

### Entity（JPA）
- `Pomodoro`:
  - id (Long, @Id)
  - roomId (Long)
  - durationMinutes (Integer)
  - result (enum String)
  - awardedCoins (Integer)
  - createdAt (Instant)

- `CoinTransaction` (MVP 用于可追溯):
  - id (Long)
  - roomId (Long)
  - delta (Integer) // 正数为增加
  - reason (String) // e.g. "POMODORO_SUCCESS"
  - createdAt (Instant)

> 可选：在 `Room` 上加 `coins` 字段并使用乐观锁（`@Version`）以便读写一致性

### Repository（接口）
- `interface PomodoroRepository extends JpaRepository<Pomodoro, Long>`
  - List<Pomodoro> findByRoomIdOrderByCreatedAtDesc(Long roomId, Pageable pageable);

- `interface CoinTransactionRepository extends JpaRepository<CoinTransaction, Long>`
  - @Query("select coalesce(sum(c.delta),0) from CoinTransaction c where c.roomId = :roomId")
    Integer sumByRoomId(@Param("roomId") Long roomId);

### Service（关键方法）
- `class PomodoroService`
  - `PomodoroResponse createPomodoro(Long roomId, CreatePomodoroRequest req)`
    - 负责：验证 room 存在 → 写 pomodoro → 如 result == SUCCESS 则触发 coins 发放（同一事务或显式事务串联）→ 返回 DTO
  - `List<PomodoroResponse> listPomodoros(Long roomId, Pageable)`

- `class CoinService`
  - `int awardCoinsForPomodoro(Long roomId, Pomodoro pomodoro)`
    - 规则硬编码：example `SUCCESS => +5`, `FAIL => +0`
  - `int getTotalCoins(Long roomId)`

> 事务策略：`createPomodoro` 使用 `@Transactional`，写入 `pomodoro` 和 `coin_transaction` 在同一事务内，保证原子性（更易演示与测试）。

---

## 错误码与验证建议
- `ROOM_NOT_FOUND`  (404)
- `INVALID_PAYLOAD` (400)
- `INTERNAL_ERROR` (500)

字段验证：`durationMinutes` > 0；`result` 为枚举值。

---

## 并发与边界条件（简要）
- Coins 操作建议使用事务写入 `CoinTransaction`，通过聚合查询（sum）或维护 `Room.coins` 字段更新（`@Version` 乐观锁）来保证并发安全。
- 为减少冲突，推荐采用 `CoinTransaction` 不做行锁，仅在读取汇总时计算 sum（简单，但读时一致性为最终一致）。若需强一致，可在 `Room` 上维护 `coins` 并在事务内更新。

---

## 测试 / 演示脚本（Curl）
1) 启动后端（H2）
2) 创建房间（如果前端无样例）
```
POST /api/rooms  { "title":"r","subject":"s" }
```
3) GET 详情
```
curl -v http://localhost:8080/api/rooms/1
```
4) POST pomodoro
```
curl -X POST -H "Content-Type: application/json" -d '{"durationMinutes":25,"result":"SUCCESS"}' http://localhost:8080/api/rooms/1/pomodoros
```
5) 验证 H2 控制台或 GET /api/rooms/1/pomodoros 返回记录
6) GET /api/rooms/1/coins 验证 coins 增加

---

## 文档与契约（必须）
- 把上面的请求/响应示例放到 `README.md` 或单独 `docs/api.md`，并写明如何本地启动、如何调试 H2
- PR 描述中务必包含：变更点、如何验证、是否有 DB 迁移、影响范围

---

## 可选扩展（如果时间允许）
- POST /api/rooms/{id}/questions （发问扣币）
- POST /api/rooms/{id}/answers （回答得币）
- 支持配置化规则（eg. coinsPerSuccess 从配置读取）
- 验证/限速：防止刷币（基于时间窗口）

---

## 验收标准（和验收点对应）
- POST /api/rooms/{id}/pomodoros 能正常记录并返回 awardedCoins
- H2 能查到 `pomodoro` 和 `coin_transaction` 记录
- GET /api/rooms/{id}/coins 返回累计 coins
- README 能按步骤跑通

---

## Deliverables for teammates ✅
- PO: 需求/规则确认（eg. SUCCESS 奖励多少）
- B（后端）: 实现 Controller/Service/Repository/Entity + 单元测试和集成测试
- C（接口负责人）: 校对契约 JSON、写验证脚本并更新 `README` 和 PR 模板

---

如需我把上面的 DTO / Entity / Controller 示例代码补成完整的 Java 文件（可直接粘贴到项目中），我可以基于现有 `Room` 实体生成一套初始实现并提交 PR 模板建议。