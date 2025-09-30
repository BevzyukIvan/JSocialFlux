package io.github.bevzyuk.jsocialflux.web.dto.postComment.response;

import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;

import java.util.List;

public record PostCommentSlice(
        List<PostCommentDTO> items,
        boolean hasNext,
        Cursor2 nextCursor
) {}
