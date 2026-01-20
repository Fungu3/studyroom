package com.studyroom.repository;

import com.studyroom.entity.NoteComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteCommentRepository extends JpaRepository<NoteComment, Long> {
}
