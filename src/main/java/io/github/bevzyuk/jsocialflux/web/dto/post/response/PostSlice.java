package io.github.bevzyuk.jsocialflux.web.dto.post.response;

import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;

import java.util.List;

public record PostSlice(
        List<PostCardDTO> content,
        boolean hasNext,
        Cursor2 nextCursor
) {}

