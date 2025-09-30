package io.github.bevzyuk.jsocialflux.web.dto.photo.response;

import java.time.Instant;

public record PhotoResponseDTO(
        Long id,
        String url,
        Instant uploadedAt,
        String description,
        String ownerUsername,
        String ownerAvatar
) {}
