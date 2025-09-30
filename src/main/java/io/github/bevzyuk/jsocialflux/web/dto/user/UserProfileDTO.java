package io.github.bevzyuk.jsocialflux.web.dto.user;

public record UserProfileDTO(
        String username,
        String avatar,
        long   followersCnt,
        long   followingCnt,
        boolean me,
        boolean following,
        boolean follower) {}
