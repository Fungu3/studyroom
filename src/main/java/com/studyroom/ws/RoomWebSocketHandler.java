package com.studyroom.ws;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final RoomRealtimeService roomRealtimeService;

    public RoomWebSocketHandler(ObjectMapper objectMapper, RoomRealtimeService roomRealtimeService) {
        this.objectMapper = objectMapper;
        this.roomRealtimeService = roomRealtimeService;
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode root;
        try {
            root = objectMapper.readTree(message.getPayload());
        } catch (Exception e) {
            send(session, envelope("error", Map.of("message", "invalid json")));
            return;
        }

        String type = root.path("type").asText("");
        JsonNode payload = root.path("payload");

        switch (type) {
            case "join" -> handleJoin(session, payload);
            case "leave" -> handleLeave(session);
            case "chat" -> handleChat(session, payload);
            case "timerStatus" -> handleTimerStatus(session, payload);
            default -> send(session, envelope("error", Map.of("message", "unknown type")));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        handleLeave(session);
        super.afterConnectionClosed(session, status);
    }

    private void handleJoin(WebSocketSession session, JsonNode payload) throws Exception {
        Long roomId = payload.path("roomId").isMissingNode() ? null : payload.path("roomId").asLong();

        JsonNode userNode = payload.path("user");
        String userId = userNode.path("id").asText(null);
        String name = userNode.path("name").asText(null);

        RoomRealtimeService.WsUser effective = roomRealtimeService.join(session, roomId, new RoomRealtimeService.WsUser(userId, name));

        // ack，让前端拿到服务端最终 userId（如果前端没传 id）
        send(session, envelope("joined", Map.of(
                "roomId", roomId,
                "user", effective
        )));

        broadcastMembers(roomId);
    }

    private void handleLeave(WebSocketSession session) throws Exception {
        Long roomId = roomRealtimeService.getJoinedRoomId(session);
        roomRealtimeService.leave(session);
        if (roomId != null) {
            broadcastMembers(roomId);
        }
    }

    private void handleChat(WebSocketSession session, JsonNode payload) throws Exception {
        Long roomId = payload.path("roomId").isMissingNode() ? null : payload.path("roomId").asLong();
        String content = payload.path("content").asText("").trim();
        if (content.isBlank()) {
            send(session, envelope("error", Map.of("message", "content is empty")));
            return;
        }
        if (content.length() > 500) {
            send(session, envelope("error", Map.of("message", "content too long")));
            return;
        }

        Long joinedRoomId = roomRealtimeService.getJoinedRoomId(session);
        if (joinedRoomId == null) {
            send(session, envelope("error", Map.of("message", "not joined")));
            return;
        }
        if (roomId != null && !roomId.equals(joinedRoomId)) {
            send(session, envelope("error", Map.of("message", "roomId mismatch")));
            return;
        }

        RoomRealtimeService.WsUser user = roomRealtimeService.getJoinedUser(session);
        Map<String, Object> chatPayload = Map.of(
                "id", UUID.randomUUID().toString(),
                "roomId", joinedRoomId,
                "user", user,
                "content", content,
                "ts", Instant.now().toEpochMilli()
        );

        roomRealtimeService.broadcastToRoom(joinedRoomId, envelope("chatMessage", chatPayload));
    }

    private void handleTimerStatus(WebSocketSession session, JsonNode payload) throws Exception {
        String status = payload.path("status").asText(null);

        Long joinedRoomId = roomRealtimeService.getJoinedRoomId(session);
        if (joinedRoomId == null) {
            send(session, envelope("error", Map.of("message", "not joined")));
            return;
        }

        roomRealtimeService.updateStatus(session, status);
        RoomRealtimeService.WsUser user = roomRealtimeService.getJoinedUser(session);

        roomRealtimeService.broadcastToRoom(joinedRoomId, envelope("timerStatus", Map.of(
                "roomId", joinedRoomId,
                "userId", user == null ? null : user.id(),
                "status", (status == null ? "idle" : status)
        )));

        broadcastMembers(joinedRoomId);
    }

    private void broadcastMembers(Long roomId) {
        var snapshot = roomRealtimeService.snapshotMembers(roomId);
        roomRealtimeService.broadcastToRoom(roomId, envelope("roomMembersUpdate", snapshot.toPayload()));
    }

    private void send(WebSocketSession session, String json) throws Exception {
        if (session != null && session.isOpen()) {
            session.sendMessage(new TextMessage(json));
        }
    }

    private String envelope(String type, Object payload) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "type", type,
                    "payload", payload
            ));
        } catch (JsonProcessingException e) {
            // fallback
            return "{\"type\":\"error\",\"payload\":{\"message\":\"json encode failed\"}}";
        }
    }
}
