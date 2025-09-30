package io.github.bevzyuk.jsocialflux.web.mapper;

import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedItemDTO;
import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedItemRow;
import org.springframework.stereotype.Component;

@Component
public class FeedItemMapper {

    public FeedItemDTO toDTO(FeedItemRow r) {
        return new FeedItemDTO(
                r.id(),
                FeedItemDTO.FeedType.valueOf(r.feedType()),
                r.username(),
                r.avatar(),
                r.content(),
                r.imageUrl(),
                r.createdAt(),
                Boolean.TRUE.equals(r.edited())
        );
    }
}

