package io.github.bevzyuk.jsocialflux.web.dto.chat.request;

import java.util.List;

public record CreateGroupChatRequest(
        String name,
        List<String> usernames
) {}
