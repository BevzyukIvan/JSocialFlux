package io.github.bevzyuk.jsocialflux.infrastructure.cloud.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UploadResponse(
        @JsonProperty("secure_url") String secureUrl
) {}
