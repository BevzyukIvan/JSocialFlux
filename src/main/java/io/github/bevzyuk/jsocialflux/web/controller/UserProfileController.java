package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoSlice;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostSlice;
import io.github.bevzyuk.jsocialflux.web.dto.common.Cursor2;
import io.github.bevzyuk.jsocialflux.web.dto.user.ProfileUpdateResponse;
import io.github.bevzyuk.jsocialflux.web.dto.user.UpdateProfileCmd;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserProfileDTO;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.application.service.PhotoService;
import io.github.bevzyuk.jsocialflux.application.service.PostService;
import io.github.bevzyuk.jsocialflux.application.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.lang.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;
    private final PostService postService;
    private final PhotoService photoService;

    @GetMapping("/{username}")
    public Mono<UserProfileDTO> profile(
            @PathVariable String username,
            @AuthenticationPrincipal @Nullable User viewer
    ) {
        return userService.getProfile(username, viewer);
    }

    @GetMapping("/{username}/posts")
    public Mono<PostSlice> posts(
            @PathVariable String username,
            @RequestParam(required = false) Long cursorTs,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "9") int size
    ) {
        Cursor2 c = (cursorTs == null && cursorId == null) ? null : new Cursor2(cursorTs, cursorId);
        return postService.getUserPostCards(username, c, size);
    }

    @GetMapping("/{username}/photos")
    public Mono<PhotoSlice> photos(
            @PathVariable String username,
            @RequestParam(required = false) Long cursorTs,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "9") int size
    ) {
        Cursor2 c = (cursorTs == null && cursorId == null) ? null : new Cursor2(cursorTs, cursorId);
        return photoService.getUserPhotoCards(username, c, size);
    }

    @PutMapping(path = "/{username}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<ProfileUpdateResponse>> update(
            @PathVariable String username,
            @RequestPart("payload") Mono<UpdateProfileCmd> reqMono,
            @RequestPart(name = "avatar", required = false) Mono<FilePart> avatarMono,
            @AuthenticationPrincipal Mono<User> currentUser) {

        Mono<Optional<FilePart>> avatarOpt = avatarMono.map(Optional::of).defaultIfEmpty(Optional.empty());

        return Mono.zip(reqMono, avatarOpt, currentUser)
                .flatMap(t -> userService.updateProfileByUsername(
                        username,
                        t.getT1(),
                        t.getT2().orElse(null),
                        t.getT3()
                ))
                .map(ResponseEntity::ok);
    }
}

