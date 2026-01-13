package com.studyroom.repository;

import com.studyroom.entity.CoinTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface CoinTransactionRepository extends JpaRepository<CoinTransaction, Long> {
    @Query("select coalesce(sum(c.delta), 0) from CoinTransaction c where c.roomId = :roomId")
    Integer sumByRoomId(@Param("roomId") Long roomId);

    @Query("select max(c.createdAt) from CoinTransaction c where c.roomId = :roomId")
    LocalDateTime lastTransactionAt(@Param("roomId") Long roomId);
}
