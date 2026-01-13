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
                // dev 下前端端口是 5173，通过 Vite 代理或直接连都需要允许跨域
                .setAllowedOriginPatterns("*");
    }
}
