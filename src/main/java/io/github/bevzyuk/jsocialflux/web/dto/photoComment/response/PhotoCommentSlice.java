package io.github.bevzyuk.jsocialflux.web.dto.photoComment.response;

import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;

import java.util.List;

public record PhotoCommentSlice(
        List<PhotoCommentDTO> items,
        boolean hasNext,
        Cursor2 nextCursor
) {}
