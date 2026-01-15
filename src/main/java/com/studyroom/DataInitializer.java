package com.studyroom;

import com.studyroom.entity.Room;
import com.studyroom.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;

    public DataInitializer(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (roomRepository.count() == 0) {
            initRooms();
        } else {
             // Optional: reset logic if requested, but check if "Test1" exists
             // user requested "Retain ONLY Test1 and Test2".
             // Simple approach: Delete all and recreate.
             roomRepository.deleteAll();
             initRooms();
        }
    }

    private void initRooms() {
        createRoom("测试1", "数学", "Capacity: 20");
        createRoom("测试2", "英语", "Capacity: 20");
        System.out.println("Initialized rooms: 测试1, 测试2");
    }

    private void createRoom(String title, String subject, String description) {
        Room room = new Room();
        room.setTitle(title);
        room.setSubject(subject);
        room.setDescription(description);
        // CreatedAt is handled by @PrePersist
        roomRepository.save(room);
    }
}
