package io.github.bevzyuk.jsocialflux.web.dto.post.response;

import java.time.Instant;

public record PostResponseDTO(
        Long id,
        String content,
        Instant createdAt,
        boolean edited,
        String ownerUsername,
        String ownerAvatar
) {}
