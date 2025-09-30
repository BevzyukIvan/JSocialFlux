package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.PostCommentService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.request.CreateCommentRequest;
import io.github.bevzyuk.jsocialflux.web.dto.postComment.response.PostCommentDTO;
import io.github.bevzyuk.jsocialflux.web.dto.postComment.response.PostCommentSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService postCommentService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<PostCommentSlice> list(@PathVariable Long postId,
                                       @RequestParam(required = false) Long cursorTs,
                                       @RequestParam(required = false) Long cursorId,
                                       @RequestParam(defaultValue = "10") int size) {
        Cursor2 c = (cursorTs == null && cursorId == null) ? null : new Cursor2(cursorTs, cursorId);
        return postCommentService.list(postId, c, size);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PostCommentDTO> create(@PathVariable Long postId,
                                       @RequestBody CreateCommentRequest req,
                                       @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> postCommentService.create(postId, p.getUsername(), req));
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long postId,
                             @PathVariable Long commentId,
                             @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> postCommentService.delete(postId, commentId, p.getUsername()));
    }
}
