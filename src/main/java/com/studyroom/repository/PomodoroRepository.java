package com.studyroom.repository;

import com.studyroom.entity.Pomodoro;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PomodoroRepository extends JpaRepository<Pomodoro, Long> {
    List<Pomodoro> findByRoomIdOrderByCreatedAtDesc(Long roomId, Pageable pageable);
}
