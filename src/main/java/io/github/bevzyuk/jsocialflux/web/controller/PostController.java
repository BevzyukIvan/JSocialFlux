package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.PostService;
import io.github.bevzyuk.jsocialflux.web.dto.post.request.UpdatePostRequest;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.post.request.CreatePostRequest;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PostCardDTO> create(@RequestBody CreatePostRequest req,
                                    @AuthenticationPrincipal Mono<UserDetails> principal) {
        return principal.flatMap(p -> postService.createPostCard(p.getUsername(), req));
    }

    @GetMapping("/{id}")
    public Mono<PostResponseDTO> getOne(@PathVariable Long id) {
        return postService.getPost(id);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<PostResponseDTO> update(@PathVariable Long id,
                                        @RequestBody UpdatePostRequest req,
                                        @AuthenticationPrincipal Mono<UserDetails> principal) {
        return principal.flatMap(p -> postService.updatePostContent(id, p.getUsername(), req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id,
                             @AuthenticationPrincipal Mono<UserDetails> principal) {
        return principal.flatMap(p -> postService.deletePost(id, p.getUsername()));
    }
}
