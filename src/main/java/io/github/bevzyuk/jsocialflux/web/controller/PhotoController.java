package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.PhotoService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.photo.request.UpdatePhotoRequest;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PhotoCardDTO> create(@RequestPart("file") FilePart file,
                                     @RequestPart(value = "description", required = false) String description,
                                     @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> photoService.createPhotoCard(p.getUsername(), file, description));
    }

    @GetMapping("/{id}")
    public Mono<PhotoResponseDTO> getOne(@PathVariable Long id) {
        return photoService.getPhoto(id);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<PhotoResponseDTO> update(@PathVariable Long id,
                                         @RequestBody UpdatePhotoRequest req,
                                         @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> photoService.updatePhotoDescription(id, p.getUsername(), req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id,
                             @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> photoService.deletePhoto(id, p.getUsername()));
    }
}
