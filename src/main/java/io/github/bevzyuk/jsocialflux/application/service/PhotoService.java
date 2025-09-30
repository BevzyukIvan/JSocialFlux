package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.photo.Photo;
import io.github.bevzyuk.jsocialflux.infrastructure.cloud.servise.CloudinaryService;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoSlice;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.PhotoRepository;
import io.github.bevzyuk.jsocialflux.web.dto.photo.request.UpdatePhotoRequest;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoResponseDTO;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;

    private final UserRepository userRepository;

    private final CloudinaryService cloudinaryService;

    private final AccessControlService accessControlService;

    public Mono<PhotoSlice> getUserPhotoCards(String username, Cursor2 cursor, int size) {
        Instant ts = (cursor == null || cursor.ts() == null) ? Instant.now() : Instant.ofEpochMilli(cursor.ts());
        long tieId = (cursor == null || cursor.id() == null) ? Long.MAX_VALUE : cursor.id();
        long limit = size + 1;

        return photoRepository.findPageByOwnerBefore(username, ts, tieId, limit)
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    Cursor2 next = null;
                    if (hasNext && !list.isEmpty()) {
                        var last = list.get(list.size() - 1);
                        next = new Cursor2(last.getUploadedAt().toEpochMilli(), last.getId());
                    }
                    return new PhotoSlice(list, hasNext, next);
                });
    }

    public Mono<PhotoCardDTO> createPhotoCard(String username, FilePart file, String description) {
        if (file == null || file.filename() == null || file.filename().isBlank()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Оберіть файл"));
        }

        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(user -> cloudinaryService
                        .uploadImage(file, "photos", user.getUsername())
                        .flatMap(url -> {
                            Photo ph = new Photo();
                            ph.setUserId(user.getId());
                            ph.setUrl(url);
                            ph.setDescription(description);
                            return photoRepository.save(ph);
                        })
                )
                .map(saved -> new PhotoCardDTO(
                        saved.getId(),
                        saved.getUrl(),
                        saved.getUploadedAt(),
                        saved.getDescription()
                ));
    }

    public Mono<PhotoResponseDTO> getPhoto(Long id) {
        return photoRepository.findResponseById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Фото не знайдено")));
    }

    public Mono<PhotoResponseDTO> updatePhotoDescription(Long photoId, String currentUsername, UpdatePhotoRequest req) {
        if (req == null || !req.isDescriptionPresent()) {
            return photoRepository.findById(photoId)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Фото не знайдено")))
                    .flatMap(photo ->
                            accessControlService.assertOwnerOrAdmin(photo.getUserId(), currentUsername)
                                    .then(photoRepository.findResponseById(photoId))
                    );
        }

        final String raw = req.getDescription();
        final String trimmed = (raw == null) ? null : raw.trim();
        if (trimmed != null && trimmed.length() > 1000) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Опис задовгий (макс 1000)"));
        }

        return photoRepository.findById(photoId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Фото не знайдено")))
                .flatMap(photo ->
                        accessControlService.assertOwnerOrAdmin(photo.getUserId(), currentUsername)
                                .then(photoRepository.updateDescriptionReturningDto(
                                        photoId,
                                        (trimmed == null || trimmed.isBlank()) ? null : trimmed
                                ))
                                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                        "Не вдалося оновити опис")))
                );
    }

    public Mono<Void> deletePhoto(Long photoId, String currentUsername) {
        return photoRepository.findById(photoId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Фото не знайдено")))
                .flatMap(photo ->
                        accessControlService.assertOwnerOrAdmin(photo.getUserId(), currentUsername)
                                .then(Mono.defer(() -> {
                                    String url = photo.getUrl();
                                    return photoRepository.deleteById(photoId)
                                            .then(cloudinaryService.deleteImage(url)
                                                    .onErrorResume(e -> Mono.empty()));
                                }))
                );
    }
}

