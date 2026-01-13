package com.studyroom.exception;

public class RoomNotFoundException extends RuntimeException {
    private final Long roomId;

    public RoomNotFoundException(Long roomId) {
        super("room " + roomId + " not found");
        this.roomId = roomId;
    }

    public Long getRoomId() {
        return roomId;
    }
}
