package com.studyroom.repository;

import com.studyroom.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByRoomIdOrderByCreatedAtDesc(Long roomId);
    List<Note> findByUserIdOrderByCreatedAtDesc(String userId);
}
