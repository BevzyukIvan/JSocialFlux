package io.github.bevzyuk.jsocialflux.web.dto.chat.response;

public record ChatOpenDTO(
        Long chatId,
        String counterpartUsername,
        String counterpartAvatar
) {}
