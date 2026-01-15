package com.studyroom.controller;

import com.studyroom.dto.LoginRequest;
import com.studyroom.dto.RegisterRequest;
import com.studyroom.entity.User;
import com.studyroom.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(req.getPassword()); 
        user.setCoins(0);
        user.setTotalStudyTimeMinutes(0L);
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public User login(@RequestBody LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        
        if (!user.getPassword().equals(req.getPassword())) {
             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return user;
    }
    
    @GetMapping("/me/{id}")
    public User getMe(@PathVariable Long id) {
        return userRepository.findById(id)
             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
