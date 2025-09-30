package io.github.bevzyuk.jsocialflux.web.dto.postComment.response;

import java.time.Instant;

public record PostCommentDTO(
        Long id,
        String content,
        Instant createdAt,
        String authorUsername,
        String authorAvatar
) {}
