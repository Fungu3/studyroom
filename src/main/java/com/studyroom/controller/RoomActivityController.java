package com.studyroom.controller;

import com.studyroom.dto.CoinsResponse;
import com.studyroom.dto.CreatePomodoroRequest;
import com.studyroom.dto.PomodoroResponse;
import com.studyroom.service.PomodoroService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms/{roomId}")
public class RoomActivityController {

    private final PomodoroService pomodoroService;

    public RoomActivityController(PomodoroService pomodoroService) {
        this.pomodoroService = pomodoroService;
    }

    @PostMapping("/pomodoros")
    @ResponseStatus(HttpStatus.CREATED)
    public PomodoroResponse createPomodoro(@PathVariable Long roomId, @Valid @RequestBody CreatePomodoroRequest req) {
        return pomodoroService.createPomodoro(roomId, req);
    }

    @GetMapping("/pomodoros")
    public List<PomodoroResponse> listPomodoros(@PathVariable Long roomId, @PageableDefault(size = 20) Pageable pageable) {
        return pomodoroService.listPomodoros(roomId, pageable);
    }

    @GetMapping("/coins")
    public CoinsResponse getCoins(@PathVariable Long roomId) {
        return pomodoroService.getCoins(roomId);
    }
}
