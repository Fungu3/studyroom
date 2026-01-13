# Studyroom

项目：Studyroom 共享自习室（协作复习房）

## 功能（当前可演示）
- 房间：创建 / 列表 / 详情
- 番茄钟：前端倒计时（25:00）
- 专注记录：记录 SUCCESS/FAIL（后端落库）
- 虚拟币 MVP：SUCCESS 固定 +5 coins（后端落库可查）

## 环境要求
- JDK 17
- Node.js 18+（建议）

## 后端启动
在项目根目录执行：
- `./mvnw spring-boot:run`

检查：
- `GET http://localhost:8080/health` → `ok`

H2 控制台：
- `http://localhost:8080/h2`
- JDBC URL：`jdbc:h2:file:./data/studyroom;MODE=MySQL`
- 用户名：`sa`，密码空

## 前端启动
在 `frontend/` 下执行：
- `npm install`
- `npm run dev`

访问：
- `http://localhost:5173/rooms`

## 关键接口（示例）
1) 创建房间
- `POST /api/rooms`
```json
{ "title": "早读房", "subject": "背单词", "description": "25分钟一个番茄" }
```

2) 房间详情
- `GET /api/rooms/{id}`

3) 记录一次 pomodoro
- `POST /api/rooms/{id}/pomodoros`
```json
{ "durationMinutes": 25, "result": "SUCCESS" }
```

4) 查询 coins
- `GET /api/rooms/{id}/coins`

更多契约见：`docs/pomodoro-coin-api.md`
