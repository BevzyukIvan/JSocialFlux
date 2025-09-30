package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.web.dto.user.UserSlice;
import io.github.bevzyuk.jsocialflux.application.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final UserService userService;

    @GetMapping
    public Mono<UserSlice> search(
            @RequestParam("q") String query,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int size) {

        return userService.searchUserSimpleDTOs(query, cursor, size);
    }
}
