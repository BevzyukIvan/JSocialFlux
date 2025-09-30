package io.github.bevzyuk.jsocialflux.web.dto.user;

public record UserStatsDTO(
        String username,
        String avatar,
        long   followersCnt,
        long   followingCnt) {}
