package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.UserDirectoryService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserDirectoryController {

    private final UserDirectoryService directory;

    @GetMapping(value = "/suggestions", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<UserSlice> myNetwork(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) Long cursor,
                                     @RequestParam(defaultValue = "20") int size,
                                     @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> directory.listMyNetwork(p.getUsername(), q, cursor, size));
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<UserSlice> search(@RequestParam String q,
                                  @RequestParam(required = false) Long cursor,
                                  @RequestParam(defaultValue = "20") int size,
                                  @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p ->
                directory.searchUsersExcludingSelf(p.getUsername(), q, cursor, size)
        );
    }
}
