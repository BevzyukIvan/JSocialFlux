package io.github.bevzyuk.jsocialflux.web.dto.user;

public record UpdateProfileCmd(
        String newUsername,
        boolean deleteAvatar
) {}

