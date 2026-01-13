package com.studyroom.dto;

import java.time.LocalDateTime;

public class CoinsResponse {
    private Long roomId;
    private Integer totalCoins;
    private LocalDateTime lastTransactionAt;

    public CoinsResponse(Long roomId, Integer totalCoins, LocalDateTime lastTransactionAt) {
        this.roomId = roomId;
        this.totalCoins = totalCoins;
        this.lastTransactionAt = lastTransactionAt;
    }

    public Long getRoomId() { return roomId; }
    public Integer getTotalCoins() { return totalCoins; }
    public LocalDateTime getLastTransactionAt() { return lastTransactionAt; }
}
