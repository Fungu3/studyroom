package com.studyroom.dto;

import com.studyroom.entity.PomodoroResult;
import java.time.LocalDateTime;

public class PomodoroResponse {
    private Long id;
    private Long roomId;
    private Integer durationMinutes;
    private PomodoroResult result;
    private Integer awardedCoins;
    private LocalDateTime createdAt;

    public PomodoroResponse(Long id, Long roomId, Integer durationMinutes, PomodoroResult result, Integer awardedCoins, LocalDateTime createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.durationMinutes = durationMinutes;
        this.result = result;
        this.awardedCoins = awardedCoins;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public PomodoroResult getResult() { return result; }
    public Integer getAwardedCoins() { return awardedCoins; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
