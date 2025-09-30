package io.github.bevzyuk.jsocialflux.web.dto.feed;

import java.util.List;

public record FeedSlice(
        List<FeedItemDTO> content,
        boolean hasNext,
        FeedCursor nextCursor
) {}
