package com.studyroom.repository;

import com.studyroom.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByNoteIdOrderByCreateTimeAsc(Long noteId);
    void deleteByNoteId(Long noteId);
}
