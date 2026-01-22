package com.studyroom.repository;

import com.studyroom.entity.NoteCollect;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NoteCollectRepository extends JpaRepository<NoteCollect, Long> {
    List<NoteCollect> findByUserIdOrderByCreateTimeDesc(Long userId);
    Optional<NoteCollect> findByNoteIdAndUserId(Long noteId, Long userId);
    List<NoteCollect> findByNoteId(Long noteId);
    void deleteByNoteId(Long noteId);
    void deleteByNoteIdAndUserId(Long noteId, Long userId);
}
