package com.studyroom.ws;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WsConfig implements WebSocketConfigurer {

    private final RoomWebSocketHandler roomWebSocketHandler;

    public WsConfig(RoomWebSocketHandler roomWebSocketHandler) {
        this.roomWebSocketHandler = roomWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
                .addHandler(roomWebSocketHandler, "/ws")
            // 允许本地开发 + 线上 Vercel
            .setAllowedOriginPatterns(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://192.168.*.*:5173",
                "http://10.*.*.*:5173",
                "http://172.*.*.*:5173",
                "https://studyroom-kappa.vercel.app"
            );
    }
}
