package io.github.bevzyuk.jsocialflux.web.dto.feed;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FeedItemDTO {

    public enum FeedType { POST, PHOTO }

    private Long id;
    private FeedType type;
    private String username;
    private String avatar;
    private String content;
    private String imageUrl;
    private Instant createdAt;
    private boolean edited;
}