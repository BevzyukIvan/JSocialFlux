package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.infrastructure.cloud.servise.CloudinaryService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.FollowRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final FollowRepository followRepository;

    private final AccessControlService accessControlService;

    private final CloudinaryService cloudinaryService;

    public Mono<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Mono<User> save(User u) {
        return userRepository.save(u);
    }

    public Mono<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Mono<UserSlice> searchUserSimpleDTOs(String query, Long cursorId, int size) {
        if (query == null || query.isBlank()) {
            return Mono.just(new UserSlice(List.of(), false, null));
        }

        long limit = size + 1;

        return userRepository.findUserUserCardDTOsByUsername(query, cursorId, limit)
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > size;
                    if (hasNext) list.remove(size);

                    Long nextCursor = hasNext
                            ? list.get(list.size() - 1).getId()
                            : null;

                    return new UserSlice(list, hasNext, nextCursor);
                });
    }

    public Mono<UserProfileDTO> getProfile(String profileName, @Nullable User viewer) {

        Mono<UserStatsDTO> statsMono = userRepository.fetchStats(profileName);

        Mono<Boolean> meMono = Mono.just(viewer != null && profileName.equals(viewer.getUsername()));

        Mono<Boolean> followingMono = (viewer == null)
                ? Mono.just(false)
                : followRepository.existsByFollowerAndFollowing(viewer.getUsername(), profileName);

        Mono<Boolean> followerMono = (viewer == null)
                ? Mono.just(false)
                : followRepository.existsByFollowerAndFollowing(profileName, viewer.getUsername());

        return Mono.zip(statsMono, meMono, followingMono, followerMono)
                .map(t -> {
                    UserStatsDTO st = t.getT1();
                    return new UserProfileDTO(
                            st.username(),
                            st.avatar(),
                            st.followersCnt(),
                            st.followingCnt(),
                            t.getT2(),
                            t.getT3(),
                            t.getT4()
                    );
                });
    }

    public Mono<UsernameDto> updateProfileByUsername(String targetUsername,
                                                     UpdateProfileCmd cmd,
                                                     @Nullable FilePart avatar,
                                                     User current) {
        return userRepository.findByUsername(targetUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMap(target -> updateProfileById(target.getId(), cmd, avatar, current));
    }

    public Mono<UsernameDto> updateProfileById(long targetUserId,
                                               UpdateProfileCmd cmd,
                                               @Nullable FilePart avatar,
                                               User current) {
        return userRepository.findById(targetUserId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .filter(u -> accessControlService.canEditUser(u, current))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN)))
                .flatMap(u -> {
                    final boolean self = u.getId() == current.getId();

                    final String oldName = u.getUsername();
                    final String nn = normalize(cmd.newUsername());
                    final boolean changeName = self && nn != null && !nn.isEmpty() && !oldName.equals(nn);

                    Mono<Void> nameCheck = changeName
                            ? userRepository.existsByUsername(nn)
                            .flatMap(exists -> exists
                                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "username already exists"))
                                    : Mono.empty())
                            : Mono.empty();

                    final String newNameToApply = changeName ? nn : null;
                    return nameCheck
                            .then(Mono.defer(() -> applyUpdates(u, newNameToApply, avatar, cmd.deleteAvatar())))
                            .flatMap(userRepository::save)
                            .map(saved -> new UsernameDto(saved.getUsername()));
                });
    }

    private static String normalize(String s) {
        if (s == null) return null;
        final String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private Mono<User> applyUpdates(User u, @Nullable String newNameToApply, @Nullable FilePart avatar, boolean deleteAvatar) {

        if (newNameToApply != null) {
            u.setUsername(newNameToApply);
        }

        Mono<Void> avatarFlow;
        if (deleteAvatar) {
            avatarFlow = deleteIfPresent(u);
        } else if (avatar != null) {
            avatarFlow = deleteIfPresent(u)
                    .then(cloudinaryService.uploadImage(avatar, "avatars", String.valueOf(u.getId()))
                            .doOnNext(u::setAvatar)
                            .then());
        } else {
            avatarFlow = Mono.empty();
        }

        return avatarFlow.thenReturn(u);
    }

    private Mono<Void> deleteIfPresent(User u) {
        return (u.getAvatar() == null)
                ? Mono.empty()
                : cloudinaryService.deleteImage(u.getAvatar())
                .doOnSuccess(__ -> u.setAvatar(null));
    }
}
