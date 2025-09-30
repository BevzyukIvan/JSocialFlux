package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.FollowRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository users;
    private final FollowRepository follows;
    private final TransactionalOperator tx;

    public Mono<Void> follow(User me, String targetName) {
        if (me.getUsername().equals(targetName)) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "self-follow"));
        }
        return users.findByUsername(targetName)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMapMany(target ->
                        tx.execute(status ->
                                follows.insertFollow(me.getId(), target.getId()).then()
                        )
                )
                .then();
    }

    public Mono<Void> unfollow(User me, String targetName) {
        return users.findByUsername(targetName)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMapMany(target ->
                        tx.execute(status ->
                                follows.deleteFollow(me.getId(), target.getId()).then()
                        )
                )
                .then();
    }
    public Mono<UserSlice> listFollowers(String username, String q, Long cursor, int size) {
        return users.findFollowersSlice(username, q, cursor, size + 1)
                .collectList()
                .map(list -> toSlice(list, size));
    }

    public Mono<UserSlice> listFollowing(String username, String q, Long cursor, int size) {
        return users.findFollowingSlice(username, q, cursor, size + 1)
                .collectList()
                .map(list -> toSlice(list, size));
    }

    private UserSlice toSlice(List<UserCardDTO> l, int size) {
        boolean hasNext = l.size() > size;
        if (hasNext) l.remove(size);
        Long next = hasNext ? l.get(l.size() - 1).getId() : null;
        return new UserSlice(l, hasNext, next);
    }
}
