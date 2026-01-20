package com.studyroom.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "note_comments")
public class NoteComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    @JsonIgnore
    private Note note;
    
    private String userId;
    private String username;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    private LocalDateTime createdAt;

    @ElementCollection
    private List<String> likedByUserIds = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private NoteComment parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL)
    private List<NoteComment> replies = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<String> getLikedByUserIds() { return likedByUserIds; }
    public void setLikedByUserIds(List<String> likedByUserIds) { this.likedByUserIds = likedByUserIds; }
    public NoteComment getParentComment() { return parentComment; }
    public void setParentComment(NoteComment parentComment) { this.parentComment = parentComment; }
    
    // Simplification for prototype: we won't expose full replies tree deeply if not needed, 
    // but the recursive structure is there.
    @JsonIgnore
    public List<NoteComment> getReplies() { return replies; } 
    public void setReplies(List<NoteComment> replies) { this.replies = replies; }
}
