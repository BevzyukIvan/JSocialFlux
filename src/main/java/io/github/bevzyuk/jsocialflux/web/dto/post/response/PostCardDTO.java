package io.github.bevzyuk.jsocialflux.web.dto.post.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class PostCardDTO {
    private Long id;
    private String content;
    private Instant createdAt;
    private boolean edited;
}

