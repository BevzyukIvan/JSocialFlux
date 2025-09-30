package io.github.bevzyuk.jsocialflux.web.dto.photo.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class PhotoCardDTO {
    private Long id;
    private String url;
    private Instant uploadedAt;
    private String description;
}
