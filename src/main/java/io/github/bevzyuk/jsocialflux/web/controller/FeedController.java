package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedCursor;
import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedSlice;
import io.github.bevzyuk.jsocialflux.application.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public Mono<FeedSlice> feed(
            @RequestParam(required = false) Long cursorTs,
            @RequestParam(required = false) String cursorType,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "10") int size
    ) {
        FeedCursor c = (cursorTs == null && cursorType == null && cursorId == null)
                ? null
                : new FeedCursor(cursorTs, cursorType, cursorId);
        return feedService.getFeedSlice(c, size);
    }
}


