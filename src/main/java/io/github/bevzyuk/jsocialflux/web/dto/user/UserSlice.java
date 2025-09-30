package io.github.bevzyuk.jsocialflux.web.dto.user;

import java.util.List;

public record UserSlice(
        List<UserCardDTO> content,
        boolean hasNext,
        Long nextCursor
) {}

