package com.studyroom.dto;

public class NoteDTOs {

    public static class PublishNoteShareRequest {
        public Long userId;
        public Long roomId;
        public String title;
        public String content;
        public String imageUrl;
    }

    public static class AddCommentRequest {
        public Long userId;
        public Long noteId;
        public String content;
        public Long replyTo;
    }

    public static class LikeCommentRequest {
        public Long userId;
        public Long commentId;
    }

    public static class CollectNoteRequest {
        public Long userId;
        public Long noteId;
    }

    public static class AddPersonalNoteRequest {
        public Long userId;
        public String title;
        public String content;
        public String imageUrl;
        public Boolean isShared;
    }

    public static class SharePersonalNoteRequest {
        public Long personalNoteId;
        public Long roomId;
    }

    public static class UpdatePersonalNoteRequest {
        public Long noteId;
        public String title;
        public String content;
        public String imageUrl;
    }
}
