package com.studyroom.dto;

import java.time.LocalDateTime;
import java.util.List;

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

    public static class DeletePersonalNoteRequest {
        public Long noteId;
        public Long userId;
    }

    public static class CommentView {
        public Long id;
        public Long noteId;
        public Long userId;
        public String username;
        public String userAvatar;
        public String content;
        public Long replyTo;
        public LocalDateTime createTime;
        public LocalDateTime createdAt;
        public Integer likeCount;
    }

    public static class NoteShareView {
        public Long id;
        public String title;
        public String content;
        public String imageUrl;
        public String image;
        public Long userId;
        public String username;
        public String userAvatar;
        public Long roomId;
        public LocalDateTime createTime;
        public Integer collectCount;
        public List<Long> collectedByUserIds;
        public List<CommentView> comments;
    }
}
