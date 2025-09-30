package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.FollowService;
import io.github.bevzyuk.jsocialflux.application.service.UserService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/users/{username}")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/follow")
    public Mono<ResponseEntity<Void>> follow(
            @PathVariable String username,
            @AuthenticationPrincipal Mono<User> me) {

        return me.flatMap(u -> followService.follow(u, username))
                .thenReturn(ResponseEntity.noContent().build());
    }

    @DeleteMapping("/follow")
    public Mono<ResponseEntity<Void>> unfollow(
            @PathVariable String username,
            @AuthenticationPrincipal Mono<User> me) {

        return me.flatMap(u -> followService.unfollow(u, username))
                .thenReturn(ResponseEntity.noContent().build());
    }

    @GetMapping("/followers")
    public Mono<UserSlice> followers(@PathVariable String username,
                                     @RequestParam(required = false) Long cursor,
                                     @RequestParam(defaultValue = "20") int size,
                                     @RequestParam(defaultValue = "") String q) {
        return followService.listFollowers(username, q, cursor, size);
    }

    @GetMapping("/following")
    public Mono<UserSlice> following(@PathVariable String username,
                                     @RequestParam(required = false) Long cursor,
                                     @RequestParam(defaultValue = "20") int size,
                                     @RequestParam(defaultValue = "") String q) {
        return followService.listFollowing(username, q, cursor, size);
    }
}

