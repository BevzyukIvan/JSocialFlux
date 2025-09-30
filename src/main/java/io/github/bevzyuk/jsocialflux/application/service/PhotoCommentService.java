package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.photo.PhotoComment;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PhotoCommentRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PhotoRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.request.CreateCommentRequest;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.response.PhotoCommentDTO;
import io.github.bevzyuk.jsocialflux.web.dto.photoComment.response.PhotoCommentSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoCommentService {

    private final PhotoRepository photoRepository;
    private final PhotoCommentRepository photoCommentRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    public Mono<PhotoCommentSlice> list(Long photoId, Cursor2 cursor, int size) {
        final Instant ts   = (cursor == null || cursor.ts() == null) ? null : Instant.ofEpochMilli(cursor.ts());
        final long    tie  = (cursor == null || cursor.id() == null) ? Long.MAX_VALUE : cursor.id();
        final long    limit = size + 1;

        return photoCommentRepository.findPageByPhotoIdBefore(photoId, ts, tie, limit)
                .collectList()
                .map(list -> {
                    final boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    Cursor2 next = null;
                    if (hasNext && !list.isEmpty()) {
                        final var last = list.get(list.size() - 1);
                        next = new Cursor2(last.createdAt().toEpochMilli(), last.id());
                    }
                    return new PhotoCommentSlice(List.copyOf(list), hasNext, next);
                });
    }

    public Mono<PhotoCommentDTO> createComment(Long photoId, String username, CreateCommentRequest req) {
        final String content = (req == null || req.content() == null) ? null : req.content().trim();
        if (content == null || content.isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Коментар не може бути порожнім"));
        }

        return photoRepository.existsById(photoId)
                .flatMap(exists -> exists
                        ? Mono.empty()
                        : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Фото не знайдено"))
                )
                .then(userRepository.findByUsername(username)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено"))))
                .flatMap(user -> {
                    PhotoComment c = new PhotoComment();
                    c.setPhotoId(photoId);
                    c.setUserId(user.getId());
                    c.setContent(content);
                    return photoCommentRepository.save(c)
                            .map(saved -> new PhotoCommentDTO(
                                    saved.getId(),
                                    saved.getContent(),
                                    saved.getCreatedAt(),
                                    user.getUsername(),
                                    user.getAvatar()
                            ));
                });
    }

    public Mono<Void> delete(Long photoId, Long commentId, String currentUsername) {
        return photoCommentRepository.findById(commentId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Коментар не знайдено")))
                .flatMap(c -> {
                    if (!c.getPhotoId().equals(photoId)) {
                        return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Коментар не належить фото"));
                    }
                    return accessControlService.assertOwnerOrAdmin(c.getUserId(), currentUsername)
                            .then(photoCommentRepository.deleteById(commentId));
                });
    }
}
