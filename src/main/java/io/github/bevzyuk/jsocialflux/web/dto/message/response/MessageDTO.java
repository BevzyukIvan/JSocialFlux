package io.github.bevzyuk.jsocialflux.web.dto.message.response;

import java.time.Instant;

public record MessageDTO(
        Long id,
        Long chatId,
        String content,
        Instant sentAt,
        String senderUsername,
        String senderAvatar
) {}
