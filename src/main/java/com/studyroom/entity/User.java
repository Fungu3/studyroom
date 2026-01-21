package com.studyroom.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    private String avatar;

    @Column(name = "room_id")
    private Long roomId;

    @Column(nullable = false, length = 100)
    private String password; // Storing as plaintext for prototype as requested implied simple auth

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private Long totalStudyTimeMinutes = 0L;
    
    private Integer coins = 0;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getTotalStudyTimeMinutes() { return totalStudyTimeMinutes; }
    public void setTotalStudyTimeMinutes(Long totalStudyTimeMinutes) { this.totalStudyTimeMinutes = totalStudyTimeMinutes; }
    public Integer getCoins() { return coins; }
    public void setCoins(Integer coins) { this.coins = coins; }
}
