package com.studyroom.controller;

import com.studyroom.dto.*;
import com.studyroom.entity.Comment;
import com.studyroom.entity.NoteShare;
import com.studyroom.service.NoteService;
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
    private final NoteService noteService;

    public RoomActivityController(PomodoroService pomodoroService, NoteService noteService) {
        this.pomodoroService = pomodoroService;
        this.noteService = noteService;
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

    // --- Note Endpoints ---

    @GetMapping("/notes")
    public List<NoteShare> getNotes(@PathVariable Long roomId) {
        return noteService.getRoomNotes(roomId);
    }

    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteShare createNote(@PathVariable Long roomId, @Valid @RequestBody CreateNoteRequest req) {
        return noteService.publishNoteShare(req.getUserId(), roomId, req.getTitle(), req.getContent(), req.getImage());
    }

    @PostMapping("/notes/{noteId}/collect")
    public void collectNote(@PathVariable Long roomId, @PathVariable Long noteId, @RequestParam Long userId) {
        noteService.collectNote(userId, noteId);
    }

    @PostMapping("/notes/{noteId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Comment addComment(@PathVariable Long roomId, @PathVariable Long noteId, @Valid @RequestBody CreateCommentRequest req) {
        return noteService.addComment(req.getUserId(), noteId, req.getContent(), req.getParentCommentId());
    }

    @PostMapping("/notes/comments/{commentId}/like")
    public void likeComment(@PathVariable Long roomId, @PathVariable Long commentId, @RequestParam(required = false) Long userId) {
        noteService.likeComment(commentId);
    }
}
