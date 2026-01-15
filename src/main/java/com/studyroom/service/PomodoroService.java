package com.studyroom.service;

import com.studyroom.dto.CoinsResponse;
import com.studyroom.dto.CreatePomodoroRequest;
import com.studyroom.dto.PomodoroResponse;
import com.studyroom.entity.CoinTransaction;
import com.studyroom.entity.Pomodoro;
import com.studyroom.entity.PomodoroResult;
import com.studyroom.entity.User;
import com.studyroom.repository.CoinTransactionRepository;
import com.studyroom.repository.PomodoroRepository;
import com.studyroom.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PomodoroService {

    private final PomodoroRepository pomodoroRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final RoomService roomService;
    private final UserRepository userRepository;

    public PomodoroService(PomodoroRepository pomodoroRepository,
                           CoinTransactionRepository coinTransactionRepository,
                           RoomService roomService,
                           UserRepository userRepository) {
        this.pomodoroRepository = pomodoroRepository;
        this.coinTransactionRepository = coinTransactionRepository;
        this.roomService = roomService;
        this.userRepository = userRepository;
    }

    @Transactional
    public PomodoroResponse createPomodoro(Long roomId, CreatePomodoroRequest req) {
        // Ensure room exists
        roomService.getRoom(roomId);
        
        // Ensure user exists
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pomodoro pomodoro = new Pomodoro();
        pomodoro.setRoomId(roomId);
        pomodoro.setUserId(req.getUserId());
        pomodoro.setDurationMinutes(req.getDurationMinutes());
        pomodoro.setResult(req.getResult());
        
        // Update user study time
        user.setTotalStudyTimeMinutes(user.getTotalStudyTimeMinutes() + req.getDurationMinutes());
        
        int coinsAwarded = 0;
        if (req.getResult() == PomodoroResult.SUCCESS) {
            // Reward rule: 5 coins for a success sesssion
            coinsAwarded = 5;
            
            CoinTransaction tx = new CoinTransaction();
            tx.setRoomId(roomId);
            tx.setUserId(req.getUserId());
            tx.setDelta(coinsAwarded);
            tx.setReason("POMODORO_SUCCESS");
            
            coinTransactionRepository.save(tx);
            
            // Update user coins
            user.setCoins(user.getCoins() + coinsAwarded);
        }
        
        userRepository.save(user); // Save updated user stats
        
        pomodoro.setAwardedCoins(coinsAwarded);
        Pomodoro saved = pomodoroRepository.save(pomodoro);

        return mapToResponse(saved);
    }

    public List<PomodoroResponse> listPomodoros(Long roomId, Pageable pageable) {
        roomService.getRoom(roomId);
        return pomodoroRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CoinsResponse getCoins(Long roomId) {
        roomService.getRoom(roomId);
        Integer total = coinTransactionRepository.sumByRoomId(roomId);
        LocalDateTime lastAt = coinTransactionRepository.lastTransactionAt(roomId);
        return new CoinsResponse(roomId, total, lastAt);
    }

    private PomodoroResponse mapToResponse(Pomodoro p) {
        return new PomodoroResponse(
            p.getId(),
            p.getRoomId(),
            p.getDurationMinutes(),
            p.getResult(),
            p.getAwardedCoins(),
            p.getCreatedAt()
        );
    }
}
