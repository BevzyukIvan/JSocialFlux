package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.post.PostComment;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PostCommentRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PostRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.request.CreateCommentRequest;
import io.github.bevzyuk.jsocialflux.web.dto.postComment.response.PostCommentDTO;
import io.github.bevzyuk.jsocialflux.web.dto.postComment.response.PostCommentSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    public Mono<PostCommentSlice> list(Long postId, Cursor2 cursor, int size) {
        final Instant ts   = (cursor == null || cursor.ts() == null) ? null : Instant.ofEpochMilli(cursor.ts());
        final long    tie  = (cursor == null || cursor.id() == null) ? Long.MAX_VALUE : cursor.id();
        final long    limit = size + 1;

        return postCommentRepository.findPageByPostIdBefore(postId, ts, tie, limit)
                .collectList()
                .map(list -> {
                    final boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    Cursor2 next = null;
                    if (hasNext && !list.isEmpty()) {
                        final var last = list.get(list.size() - 1);
                        next = new Cursor2(last.createdAt().toEpochMilli(), last.id());
                    }
                    return new PostCommentSlice(List.copyOf(list), hasNext, next);
                });
    }

    public Mono<PostCommentDTO> create(Long postId, String username, CreateCommentRequest req) {
        final String content = (req == null || req.content() == null) ? null : req.content().trim();
        if (content == null || content.isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Коментар не може бути порожнім"));
        }

        return postRepository.existsById(postId)
                .flatMap(exists -> exists
                        ? Mono.empty()
                        : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Пост не знайдено")))
                .then(userRepository.findByUsername(username)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено"))))
                .flatMap(user -> {
                    PostComment c = new PostComment();
                    c.setPostId(postId);
                    c.setUserId(user.getId());
                    c.setContent(content);
                    return postCommentRepository.save(c)
                            .map(saved -> new PostCommentDTO(
                                    saved.getId(),
                                    saved.getContent(),
                                    saved.getCreatedAt(),
                                    user.getUsername(),
                                    user.getAvatar()
                            ));
                });
    }

    public Mono<Void> delete(Long postId, Long commentId, String currentUsername) {
        return postCommentRepository.findById(commentId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Коментар не знайдено")))
                .flatMap(c -> {
                    if (!c.getPostId().equals(postId)) {
                        return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Коментар не належить посту"));
                    }
                    return accessControlService.assertOwnerOrAdmin(c.getUserId(), currentUsername)
                            .then(postCommentRepository.deleteById(commentId));
                });
    }
}
