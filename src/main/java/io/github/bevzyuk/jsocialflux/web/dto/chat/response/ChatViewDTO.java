package io.github.bevzyuk.jsocialflux.web.dto.chat.response;

import java.time.Instant;

public record ChatViewDTO(
        Long chatId,
        String displayName,
        String displayAvatar,
        boolean isGroup,
        String lastMessage,
        Instant lastSentAt
) {}