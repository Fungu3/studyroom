package com.studyroom.controller;

import com.studyroom.dto.CreateRoomRequest;
import com.studyroom.entity.Room;
import com.studyroom.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")

public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<Room> list() {
        return roomService.list();
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
