package com.studyroom.service;

import com.studyroom.dto.CreateRoomRequest;
import com.studyroom.entity.Room;
import com.studyroom.exception.RoomNotFoundException;
import com.studyroom.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room create(CreateRoomRequest req) {
        Room room = new Room();
        room.setName(req.getTitle());
        // room.setSubject(req.getSubject()); // Removed in new schema
        // room.setDescription(req.getDescription()); // Removed in new schema
        return roomRepository.save(room);
    }

    public List<Room> list() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));
    }

    public Room update(Long id, CreateRoomRequest req) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));
        room.setName(req.getTitle());
        // room.setSubject(req.getSubject());
        // room.setDescription(req.getDescription());
        return roomRepository.save(room);
    }

    public void delete(Long id) {
        roomRepository.deleteById(id);
    }

}

