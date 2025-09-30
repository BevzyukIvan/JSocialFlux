package io.github.bevzyuk.jsocialflux.web.dto.chat.request;

import java.util.List;

public record AddParticipantsRequest(
        List<String> usernames
) {}
