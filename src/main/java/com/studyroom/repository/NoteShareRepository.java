package com.studyroom.repository;

import com.studyroom.entity.NoteShare;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteShareRepository extends JpaRepository<NoteShare, Long> {
    List<NoteShare> findByRoomIdOrderByCreateTimeDesc(Long roomId);
}
