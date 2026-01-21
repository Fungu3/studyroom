package com.studyroom.controller;

import com.studyroom.common.Result;
import com.studyroom.dto.NoteDTOs.*;
import com.studyroom.entity.Comment;
import com.studyroom.entity.NoteShare;
import com.studyroom.entity.PersonalNote;
import com.studyroom.service.NoteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/note")
@CrossOrigin(origins = "*") // Allow frontend access
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    // --- Share Note ---
    @PostMapping("/share/publish")
    public Result<NoteShare> publishNoteShare(@RequestBody PublishNoteShareRequest request) {
        NoteShare note = noteService.publishNoteShare(
            request.userId, request.roomId, request.title, request.content, request.imageUrl
        );
        return Result.success(note);
    }

    @GetMapping("/share/list")
    public Result<List<NoteShare>> getRoomNotes(@RequestParam Long roomId) {
        return Result.success(noteService.getRoomNotes(roomId));
    }

    // --- Comment ---
    @PostMapping("/comment/add")
    public Result<Comment> addComment(@RequestBody AddCommentRequest request) {
        Comment comment = noteService.addComment(
            request.userId, request.noteId, request.content, request.replyTo
        );
        return Result.success(comment);
    }

    @GetMapping("/comment/list")
    public Result<List<Comment>> getNoteComments(@RequestParam Long noteId) {
        return Result.success(noteService.getNoteComments(noteId));
    }

    @PostMapping("/comment/like")
    public Result<Void> likeComment(@RequestBody LikeCommentRequest request) {
        noteService.likeComment(request.commentId);
        return Result.success();
    }

    // --- Collect ---
    @PostMapping("/collect/add")
    public Result<Void> collectNote(@RequestBody CollectNoteRequest request) {
        noteService.collectNote(request.userId, request.noteId);
        return Result.success();
    }

    @GetMapping("/collect/list")
    public Result<List<NoteShare>> getCollectedNotes(@RequestParam Long userId) {
        return Result.success(noteService.getCollectedNotes(userId));
    }

    // --- Personal Note ---
    @PostMapping("/personal/add")
    public Result<PersonalNote> addPersonalNote(@RequestBody AddPersonalNoteRequest request) {
        PersonalNote note = noteService.addPersonalNote(
            request.userId, request.title, request.content, request.imageUrl, request.isShared
        );
        return Result.success(note);
    }

    @GetMapping("/personal/list")
    public Result<List<PersonalNote>> getPersonalNotes(@RequestParam Long userId) {
        return Result.success(noteService.getPersonalNotes(userId));
    }

    @PostMapping("/personal/share")
    public Result<Void> sharePersonalNote(@RequestBody SharePersonalNoteRequest request) {
        noteService.sharePersonalNote(request.personalNoteId, request.roomId);
        return Result.success();
    }

    @PostMapping("/personal/update")
    public Result<PersonalNote> updatePersonalNote(@RequestBody UpdatePersonalNoteRequest request) {
        PersonalNote note = noteService.updatePersonalNote(
            request.noteId, request.title, request.content, request.imageUrl
        );
        return Result.success(note);
    }
}
