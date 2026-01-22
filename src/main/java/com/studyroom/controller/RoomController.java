package com.studyroom.controller;

import com.studyroom.dto.CreateRoomRequest;
import com.studyroom.entity.Room;
import com.studyroom.service.RoomService;
import com.studyroom.ws.RoomRealtimeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")

public class RoomController {

    private final RoomService roomService;
    private final RoomRealtimeService roomRealtimeService;

    public RoomController(RoomService roomService, RoomRealtimeService roomRealtimeService) {
        this.roomService = roomService;
        this.roomRealtimeService = roomRealtimeService;
    }

    @GetMapping
    public List<Room> list() {
        List<Room> rooms = roomService.list();
        rooms.forEach(room -> {
            int count = roomRealtimeService.snapshotMembers(room.getId()).count();
            room.setOnlineUsers(count);
        });
        return rooms;
    }

    @GetMapping("/{id}")
    public Room get(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    @PostMapping
    public Room create(@Valid @RequestBody CreateRoomRequest req) {
        return roomService.create(req);
    }
    @PutMapping("/{id}")
    public Room update(@PathVariable Long id, @Valid @RequestBody CreateRoomRequest req) {
        return roomService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        roomService.delete(id);
    }

}
