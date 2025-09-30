package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.PhotoCommentService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.request.CreateCommentRequest;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.response.PhotoCommentSlice;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.response.PhotoCommentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/photos/{photoId}/comments")
@RequiredArgsConstructor
public class PhotoCommentController {

    private final PhotoCommentService photoCommentService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<PhotoCommentSlice> list(@PathVariable Long photoId,
                                        @RequestParam(required = false) Long cursorTs,
                                        @RequestParam(required = false) Long cursorId,
                                        @RequestParam(defaultValue = "10") int size) {
        Cursor2 c = (cursorTs == null && cursorId == null) ? null : new Cursor2(cursorTs, cursorId);
        return photoCommentService.list(photoId, c, size);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PhotoCommentDTO> create(@PathVariable Long photoId,
                                        @RequestBody CreateCommentRequest req,
                                        @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> photoCommentService.createComment(photoId, p.getUsername(), req));
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long photoId,
                             @PathVariable Long commentId,
                             @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> photoCommentService.delete(photoId, commentId, p.getUsername()));
    }
}
