package io.github.bevzyuk.jsocialflux.web.dto.message.response;

import java.util.List;

public record MessageSlice(
        List<MessageDTO> items,
        boolean hasNext,
        Long nextCursorEpochMs,
        Long nextCursorId
) {}
