package com.studyroom.controller;

import com.studyroom.dto.*;
import com.studyroom.entity.Note;
import com.studyroom.entity.NoteComment;
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
    public List<Note> getNotes(@PathVariable Long roomId) {
        return noteService.getNotesByRoom(roomId);
    }

    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public Note createNote(@PathVariable Long roomId, @Valid @RequestBody CreateNoteRequest req) {
        return noteService.createNote(roomId, req.getUserId(), req.getTitle(), req.getContent(), req.getImage());
    }

    @PostMapping("/notes/{noteId}/collect")
    public void collectNote(@PathVariable Long roomId, @PathVariable Long noteId, @RequestParam String userId) {
        noteService.collectNote(noteId, userId);
    }

    @PostMapping("/notes/{noteId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteComment addComment(@PathVariable Long roomId, @PathVariable Long noteId, @Valid @RequestBody CreateCommentRequest req) {
        return noteService.addComment(noteId, req.getUserId(), req.getContent(), req.getParentCommentId());
    }

    @PostMapping("/notes/comments/{commentId}/like")
    public void likeComment(@PathVariable Long roomId, @PathVariable Long commentId, @RequestParam String userId) {
        noteService.likeComment(commentId, userId);
    }
}
