package com.studyroom.dto;

import com.studyroom.entity.PomodoroResult;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CreatePomodoroRequest {
    @NotNull
    @Positive
    private Integer durationMinutes;

    @NotNull
    private PomodoroResult result;

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public PomodoroResult getResult() { return result; }
    public void setResult(PomodoroResult result) { this.result = result; }
}
