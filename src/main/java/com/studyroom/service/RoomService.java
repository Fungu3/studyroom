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
        room.setTitle(req.getTitle());
        room.setSubject(req.getSubject());
        room.setDescription(req.getDescription());
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
        room.setTitle(req.getTitle());
        room.setSubject(req.getSubject());
        room.setDescription(req.getDescription());
        return roomRepository.save(room);
    }

    public void delete(Long id) {
        roomRepository.deleteById(id);
    }

}

