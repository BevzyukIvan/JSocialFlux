package io.github.bevzyuk.jsocialflux.web.dto.photo.response;

import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;

import java.util.List;

public record PhotoSlice(
        List<PhotoCardDTO> content,
        boolean hasNext,
        Cursor2 nextCursor
) {}

