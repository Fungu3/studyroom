package com.studyroom.repository;

import com.studyroom.entity.PersonalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PersonalNoteRepository extends JpaRepository<PersonalNote, Long> {
    List<PersonalNote> findByUserIdOrderByCreateTimeDesc(Long userId);
}
