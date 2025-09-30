package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedCursor;
import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedItemDTO;
import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedSlice;
import io.github.bevzyuk.jsocialflux.web.mapper.FeedItemMapper;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.FeedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final FeedRepository repo;
    private final FeedItemMapper mapper;


    public Mono<FeedSlice> getFeedSlice(@Nullable FeedCursor cursor, int size) {
        final Instant ts   = (cursor == null || cursor.ts() == null) ? null : Instant.ofEpochMilli(cursor.ts());
        final Integer ord  = (cursor == null || cursor.type() == null) ? null : feedOrder(cursor.type());
        final Long id      = (cursor == null) ? null : cursor.id();

        return repo.findPage(ts, ord, id, size + 1)
                .map(mapper::toDTO)
                .collectList()
                .map(list -> {
                    final boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    FeedCursor next = null;
                    if (hasNext && !list.isEmpty()) {
                        final FeedItemDTO last = list.get(list.size() - 1);
                        next = new FeedCursor(
                                last.getCreatedAt().toEpochMilli(),
                                last.getType().name(),
                                last.getId()
                        );
                    }
                    return new FeedSlice(list, hasNext, next);
                });
    }

    private static int feedOrder(String type) {
        return "POST".equalsIgnoreCase(type) ? 2 : 1;
    }
}


