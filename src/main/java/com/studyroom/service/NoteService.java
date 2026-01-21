package com.studyroom.service;

import com.studyroom.entity.*;
import com.studyroom.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoteService {

    private final NoteShareRepository noteShareRepository;
    private final NoteCollectRepository noteCollectRepository;
    private final CommentRepository commentRepository;
    private final PersonalNoteRepository personalNoteRepository;
    private final UserRepository userRepository;

    public NoteService(NoteShareRepository noteShareRepository,
                       NoteCollectRepository noteCollectRepository,
                       CommentRepository commentRepository,
                       PersonalNoteRepository personalNoteRepository,
                       UserRepository userRepository) {
        this.noteShareRepository = noteShareRepository;
        this.noteCollectRepository = noteCollectRepository;
        this.commentRepository = commentRepository;
        this.personalNoteRepository = personalNoteRepository;
        this.userRepository = userRepository;
    }

    // --- Share Note ---
    public NoteShare publishNoteShare(Long userId, Long roomId, String title, String content, String imageUrl) {
        NoteShare note = new NoteShare();
        note.setUserId(userId);
        note.setRoomId(roomId);
        note.setTitle(title);
        note.setContent(content);
        note.setImageUrl(imageUrl);
        return noteShareRepository.save(note);
    }

    public List<NoteShare> getRoomNotes(Long roomId) {
        return noteShareRepository.findByRoomIdOrderByCreateTimeDesc(roomId);
    }

    // --- Comment ---
    public Comment addComment(Long userId, Long noteId, String content, Long replyTo) {
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setNoteId(noteId);
        comment.setContent(content);
        comment.setReplyTo(replyTo);
        return commentRepository.save(comment);
    }

    public List<Comment> getNoteComments(Long noteId) {
        return commentRepository.findByNoteIdOrderByCreateTimeAsc(noteId);
    }

    public void likeComment(Long commentId) {
        commentRepository.findById(commentId).ifPresent(comment -> {
            comment.setLikeCount(comment.getLikeCount() + 1);
            commentRepository.save(comment);
        });
    }

    // --- Collect ---
    public void collectNote(Long userId, Long noteId) {
        if (noteCollectRepository.findByNoteIdAndUserId(noteId, userId).isPresent()) {
            return;
        }

        NoteCollect collect = new NoteCollect();
        collect.setUserId(userId);
        collect.setNoteId(noteId);
        noteCollectRepository.save(collect);

        noteShareRepository.findById(noteId).ifPresent(note -> {
            note.setCollectCount(note.getCollectCount() + 1);
            noteShareRepository.save(note);
            
            userRepository.findById(note.getUserId()).ifPresent(publisher -> {
                publisher.setCoins(publisher.getCoins() + 1);
                userRepository.save(publisher);
            });
        });
    }

    public List<NoteShare> getCollectedNotes(Long userId) {
        List<NoteCollect> collections = noteCollectRepository.findByUserIdOrderByCreateTimeDesc(userId);
        if (collections.isEmpty()) return Collections.emptyList();
        
        List<Long> noteIds = collections.stream().map(NoteCollect::getNoteId).collect(Collectors.toList());
        return noteShareRepository.findAllById(noteIds);
    }

    // --- Personal Note ---
    public PersonalNote addPersonalNote(Long userId, String title, String content, String imageUrl, Boolean isShared) {
        PersonalNote note = new PersonalNote();
        note.setUserId(userId);
        note.setTitle(title);
        note.setContent(content);
        note.setImageUrl(imageUrl);
        note.setIsShared(isShared != null && isShared);
        return personalNoteRepository.save(note);
    }

    public List<PersonalNote> getPersonalNotes(Long userId) {
        return personalNoteRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    public void sharePersonalNote(Long personalNoteId, Long roomId) {
        personalNoteRepository.findById(personalNoteId).ifPresent(pNote -> {
            // Copy to NoteShare
            NoteShare share = new NoteShare();
            share.setTitle(pNote.getTitle());
            share.setContent(pNote.getContent());
            share.setImageUrl(pNote.getImageUrl());
            share.setUserId(pNote.getUserId());
            share.setRoomId(roomId);
            noteShareRepository.save(share);

            // Update status
            pNote.setIsShared(true);
            personalNoteRepository.save(pNote);
        });
    }

    public PersonalNote updatePersonalNote(Long noteId, String title, String content, String imageUrl) {
        return personalNoteRepository.findById(noteId).map(note -> {
            if (title != null) note.setTitle(title);
            if (content != null) note.setContent(content);
            if (imageUrl != null) note.setImageUrl(imageUrl);
            return personalNoteRepository.save(note);
        }).orElse(null);
    }
}
