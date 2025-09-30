package io.github.bevzyuk.jsocialflux.web.dto.photoComment.response;

import java.time.Instant;

public record PhotoCommentDTO(
        Long id,
        String content,
        Instant createdAt,
        String authorUsername,
        String authorAvatar
) {}