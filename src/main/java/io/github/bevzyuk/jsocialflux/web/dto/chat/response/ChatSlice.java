package io.github.bevzyuk.jsocialflux.web.dto.chat.response;

import java.util.List;

public record ChatSlice(
        List<ChatViewDTO> items,
        boolean hasNext,
        Long nextCursorEpochMs,
        Long nextCursorId
) {}
