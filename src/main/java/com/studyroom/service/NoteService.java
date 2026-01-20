package com.studyroom.service;

import com.studyroom.entity.Note;
import com.studyroom.entity.NoteComment;
import com.studyroom.entity.User;
import com.studyroom.repository.NoteCommentRepository;
import com.studyroom.repository.NoteRepository;
import com.studyroom.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteCommentRepository commentRepository;
    private final UserRepository userRepository;

    public NoteService(NoteRepository noteRepository, NoteCommentRepository commentRepository, UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    private Optional<User> findUser(String userId) {
        try {
            Long id = Long.parseLong(userId);
            return userRepository.findById(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public Note createNote(Long roomId, String userId, String title, String content, String image) {
        User user = findUser(userId).orElse(null);
        String username = (user != null) ? user.getUsername() : "Guest";
        
        Note note = new Note();
        note.setRoomId(roomId);
        note.setUserId(userId);
        note.setUsername(username);
        note.setTitle(title);
        note.setContent(content);
        note.setImage(image);
        return noteRepository.save(note);
    }

    public List<Note> getNotesByRoom(Long roomId) {
        return noteRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
    }

    public void collectNote(Long noteId, String userId) {
        Note note = noteRepository.findById(noteId).orElseThrow(() -> new RuntimeException("Note not found"));
        if (!note.getCollectedByUserIds().contains(userId)) {
            note.getCollectedByUserIds().add(userId);
            noteRepository.save(note);
            
            // Coin logic
            try {
                if (!note.getUserId().equals(userId)) { 
                     Long authorId = Long.parseLong(note.getUserId());
                     User author = userRepository.findById(authorId).orElse(null);
                     if (author != null) {
                         author.setCoins(author.getCoins() + 1);
                         userRepository.save(author);
                     }
                }
            } catch (NumberFormatException e) {
                // Author is guest, no coins
            }
        }
    }

    public NoteComment addComment(Long noteId, String userId, String content, Long parentCommentId) {
        User user = findUser(userId).orElse(null);
        String username = (user != null) ? user.getUsername() : "Guest";

        Note note = noteRepository.findById(noteId).orElseThrow();
        
        NoteComment comment = new NoteComment();
        comment.setNote(note);
        comment.setUserId(userId);
        comment.setUsername(username);
        comment.setContent(content);
        
        if (parentCommentId != null) {
            NoteComment parent = commentRepository.findById(parentCommentId).orElse(null);
            comment.setParentComment(parent);
        }
        
        return commentRepository.save(comment);
    }

    public void likeComment(Long commentId, String userId) {
        NoteComment comment = commentRepository.findById(commentId).orElseThrow();
        if (!comment.getLikedByUserIds().contains(userId)) {
            comment.getLikedByUserIds().add(userId);
            commentRepository.save(comment);
        }
    }
}
