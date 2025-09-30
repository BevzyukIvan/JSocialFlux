package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.post.Post;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.post.request.UpdatePostRequest;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostResponseDTO;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostSlice;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PostRepository;
import io.github.bevzyuk.jsocialflux.web.dto.post.request.CreatePostRequest;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final AccessControlService accessControlService;
    public Mono<PostSlice> getUserPostCards(String username, Cursor2 cursor, int size) {
        Instant ts = (cursor == null || cursor.ts() == null) ? Instant.now() : Instant.ofEpochMilli(cursor.ts());
        long tieId = (cursor == null || cursor.id() == null) ? Long.MAX_VALUE : cursor.id();
        long limit = size + 1;

        return postRepository.findPageByOwnerBefore(username, ts, tieId, limit)
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    Cursor2 next = null;
                    if (hasNext && !list.isEmpty()) {
                        var last = list.get(list.size() - 1);
                        next = new Cursor2(last.getCreatedAt().toEpochMilli(), last.getId());
                    }
                    return new PostSlice(list, hasNext, next);
                });
    }

    public Mono<PostCardDTO> createPostCard(String username, CreatePostRequest req) {
        final String content = (req == null || req.content() == null)
                ? null
                : req.content().trim();

        if (content == null || content.isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Текст поста не може бути порожнім"));
        }

        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(user -> {
                    Post post = new Post();
                    post.setUserId(user.getId());
                    post.setContent(content);
                    return postRepository.save(post);
                })
                .map(saved -> new PostCardDTO(
                        saved.getId(),
                        saved.getContent(),
                        saved.getCreatedAt(),
                        saved.isEdited()
                ));
    }

    public Mono<PostResponseDTO> getPost(Long id) {
        return postRepository.findResponseById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Пост не знайдено")));
    }

    public Mono<PostResponseDTO> updatePostContent(Long postId, String currentUsername, UpdatePostRequest req) {
        return postRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Пост не знайдено")))
                .flatMap(post ->
                        accessControlService.assertOwnerOrAdmin(post.getUserId(), currentUsername)
                                .then(Mono.defer(() -> {
                                    if (req == null || !req.isContentPresent()) {
                                        return postRepository.findResponseById(postId);
                                    }

                                    final String trimmed = (req.getContent() == null) ? null : req.getContent().trim();
                                    if (trimmed == null || trimmed.isEmpty()) {
                                        return Mono.error(new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Текст поста не може бути порожнім"
                                        ));
                                    }
                                    if (trimmed.length() > 1000) {
                                        return Mono.error(new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Текст задовгий (макс 1000 символів)"
                                        ));
                                    }

                                    return postRepository.updateContentReturningDto(postId, trimmed)
                                            .switchIfEmpty(Mono.error(new ResponseStatusException(
                                                    HttpStatus.INTERNAL_SERVER_ERROR, "Не вдалося оновити пост"
                                            )));
                                }))
                );
    }

    public Mono<Void> deletePost(Long postId, String currentUsername) {
        return postRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Пост не знайдено")))
                .flatMap(post ->
                        accessControlService.assertOwnerOrAdmin(post.getUserId(), currentUsername)
                                .then(postRepository.deleteById(postId))
                );
    }
}

