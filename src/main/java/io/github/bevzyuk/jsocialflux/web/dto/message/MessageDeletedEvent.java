package io.github.bevzyuk.jsocialflux.web.dto.message;

public record MessageDeletedEvent(
        Long id,
        Long chatId
) {}
