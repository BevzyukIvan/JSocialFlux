package io.github.bevzyuk.jsocialflux.web.dto.feed;

import java.time.Instant;

public record FeedItemRow(
        Long id,
        String feedType,
        String username,
        String avatar,
        String content,
        String imageUrl,
        Instant createdAt,
        Boolean edited
) {}
