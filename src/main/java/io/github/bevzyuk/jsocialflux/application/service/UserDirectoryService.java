package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDirectoryService {

    private final UserRepository userRepository;

    public Mono<UserSlice> listMyNetwork(String currentUsername, @Nullable String q, Long cursorId, int size) {
        int page = Math.max(1, Math.min(size, 100));
        String query = (q == null) ? "" : q.trim();

        return userRepository.findByUsername(currentUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(__ ->
                        userRepository.findNetworkSlice(currentUsername, query, cursorId, page + 1)
                                .collectList()
                                .map(list -> {
                                    boolean hasNext = list.size() > page;
                                    if (hasNext) list.remove(page);
                                    Long nextCursor = hasNext ? list.get(list.size() - 1).getId() : null;
                                    return new UserSlice(List.copyOf(list), hasNext, nextCursor);
                                })
                );
    }

    public Mono<UserSlice> searchUsersExcludingSelf(String currentUsername, String query, Long cursorId, int size) {
        if (query == null || query.isBlank()) {
            return Mono.just(new UserSlice(List.of(), false, null));
        }
        int page = Math.max(1, Math.min(size, 100));
        long limit = page + 1;

        return userRepository.findUserUserCardDTOsByUsernameExcluding(
                        query, cursorId, limit, currentUsername
                )
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > page;
                    if (hasNext) list.remove(page);
                    Long nextCursor = hasNext ? list.get(list.size() - 1).getId() : null;
                    return new UserSlice(list, hasNext, nextCursor);
                });
    }
}
