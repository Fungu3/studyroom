package com.studyroom.ws;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomRealtimeService {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<String, MemberState>> membersByRoom = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, java.util.Set<WebSocketSession>> sessionsByRoom = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SessionState> sessionStateBySessionId = new ConcurrentHashMap<>();

    public record WsUser(String id, String name) {}

    private static final class MemberState {
        private final String userId;
        private volatile String name;
        private volatile String status; // focusing / idle
        private volatile int connections;
        private volatile long lastActiveAt;

        private MemberState(String userId, String name) {
            this.userId = userId;
            this.name = name;
            this.status = "idle";
            this.connections = 0;
            this.lastActiveAt = Instant.now().toEpochMilli();
        }
    }

    private record SessionState(Long roomId, String userId, String name) {}

    public synchronized WsUser join(WebSocketSession session, Long roomId, WsUser user) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId is required");
        }

        // if already joined, leave first
        leave(session);

        String userId = (user == null || user.id() == null || user.id().isBlank())
                ? UUID.randomUUID().toString()
                : user.id();
        String name = (user == null || user.name() == null || user.name().isBlank())
                ? "匿名"
                : user.name();

        sessionStateBySessionId.put(session.getId(), new SessionState(roomId, userId, name));

        sessionsByRoom.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        ConcurrentHashMap<String, MemberState> memberMap = membersByRoom.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        MemberState ms = memberMap.computeIfAbsent(userId, uid -> new MemberState(uid, name));
        ms.name = name;
        ms.connections += 1;
        ms.lastActiveAt = Instant.now().toEpochMilli();

        return new WsUser(userId, name);
    }

    public synchronized void leave(WebSocketSession session) {
        SessionState ss = sessionStateBySessionId.remove(session.getId());
        if (ss == null) {
            return;
        }

        Long roomId = ss.roomId();
        String userId = ss.userId();

        java.util.Set<WebSocketSession> sessions = sessionsByRoom.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByRoom.remove(roomId);
            }
        }

        ConcurrentHashMap<String, MemberState> memberMap = membersByRoom.get(roomId);
        if (memberMap != null) {
            MemberState ms = memberMap.get(userId);
            if (ms != null) {
                ms.connections = Math.max(0, ms.connections - 1);
                ms.lastActiveAt = Instant.now().toEpochMilli();
                if (ms.connections <= 0) {
                    memberMap.remove(userId);
                }
            }
            if (memberMap.isEmpty()) {
                membersByRoom.remove(roomId);
            }
        }
    }

    public synchronized Long getJoinedRoomId(WebSocketSession session) {
        SessionState ss = sessionStateBySessionId.get(session.getId());
        return ss == null ? null : ss.roomId();
    }

    public synchronized WsUser getJoinedUser(WebSocketSession session) {
        SessionState ss = sessionStateBySessionId.get(session.getId());
        if (ss == null) return null;
        return new WsUser(ss.userId(), ss.name());
    }

    public synchronized void updateStatus(WebSocketSession session, String status) {
        SessionState ss = sessionStateBySessionId.get(session.getId());
        if (ss == null) {
            throw new IllegalStateException("not joined");
        }
        String normalized = normalizeStatus(status);
        ConcurrentHashMap<String, MemberState> memberMap = membersByRoom.get(ss.roomId());
        if (memberMap == null) return;
        MemberState ms = memberMap.get(ss.userId());
        if (ms == null) return;
        ms.status = normalized;
        ms.lastActiveAt = Instant.now().toEpochMilli();
    }

    private static String normalizeStatus(String status) {
        if (status == null) return "idle";
        String s = status.trim().toLowerCase();
        return s.equals("focusing") ? "focusing" : "idle";
    }

    public synchronized void broadcastToRoom(Long roomId, String json) {
        java.util.Set<WebSocketSession> sessions = sessionsByRoom.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;

        List<WebSocketSession> closed = new ArrayList<>();
        for (WebSocketSession s : sessions) {
            if (s == null || !s.isOpen()) {
                closed.add(s);
                continue;
            }
            try {
                s.sendMessage(new TextMessage(json));
            } catch (IOException e) {
                closed.add(s);
            }
        }
        // cleanup
        for (WebSocketSession s : closed) {
            if (s != null) {
                leave(s);
            }
        }
    }

    public synchronized RoomMembersSnapshot snapshotMembers(Long roomId) {
        ConcurrentHashMap<String, MemberState> memberMap = membersByRoom.get(roomId);
        if (memberMap == null) {
            return new RoomMembersSnapshot(roomId, List.of());
        }

        List<RoomMember> members = memberMap.values().stream()
                .filter(m -> m.connections > 0)
                .sorted(Comparator.comparing((MemberState m) -> m.name == null ? "" : m.name))
                .map(m -> new RoomMember(m.userId, m.name, m.status))
                .toList();

        return new RoomMembersSnapshot(roomId, members);
    }

    public record RoomMember(String id, String name, String status) {}

    public record RoomMembersSnapshot(Long roomId, List<RoomMember> members) {
        public int count() {
            return members == null ? 0 : members.size();
        }

        public Map<String, Object> toPayload() {
            return Map.of(
                    "roomId", roomId,
                    "members", members == null ? List.of() : members,
                    "count", count()
            );
        }
    }
}
