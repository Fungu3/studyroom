package com.studyroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateRoomRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    @Size(max = 50)
    private String subject;

    @Size(max = 300)
    private String description;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
