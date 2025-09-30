package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.config.ws.RealtimeEvents;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.ChatRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.AddParticipantsRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.CreateGroupChatRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.StartPrivateChatRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatOpenDTO;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final TransactionalOperator tx;
    private final RealtimeEvents events;

    public Mono<ChatSlice> listForUserSlice(String currentUsername, Long cursorEpochMs, Long cursorId, int size) {
        int page = Math.max(1, Math.min(size, 100));
        Instant cursorTime = (cursorEpochMs == null) ? Instant.now() : Instant.ofEpochMilli(cursorEpochMs);
        Long curId = (cursorId == null) ? Long.MAX_VALUE : cursorId;

        return chatRepository.findChatViewsForUserSlice(currentUsername, cursorTime, curId, page + 1)
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > page;
                    if (hasNext) list.remove(page);

                    Long nextTime = hasNext ? list.get(list.size() - 1).lastSentAt().toEpochMilli() : null;
                    Long nextId   = hasNext ? list.get(list.size() - 1).chatId()                    : null;
                    return new ChatSlice(list, hasNext, nextTime, nextId);
                });
    }

    public Mono<ChatOpenDTO> startPrivate(String currentUsername, StartPrivateChatRequest req) {
        final String otherUsername = (req == null) ? null : req.username();
        if (!StringUtils.hasText(otherUsername)) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Вкажіть username співрозмовника"));
        }
        if (otherUsername.equals(currentUsername)) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Не можна почати чат із самим собою"));
        }

        Mono<User> meMono    = userRepository.findByUsername(currentUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Поточний користувач не знайдений")));
        Mono<User> otherMono = userRepository.findByUsername(otherUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено: " + otherUsername)));

        return Mono.zip(meMono, otherMono)
                .flatMap(tuple -> {
                    User me    = tuple.getT1();
                    User other = tuple.getT2();

                    String key = privateKey(me.getId(), other.getId());

                    Mono<ChatOpenDTO> work = chatRepository.insertPrivateIfAbsentReturnId(key)
                            .switchIfEmpty(Mono.defer(() -> chatRepository.findPrivateChatIdByKey(key)))
                            .flatMap(chatId ->
                                    chatRepository.addTwoParticipants(chatId, me.getId(), other.getId())
                                            .then(Mono.fromSupplier(() ->
                                                    new ChatOpenDTO(chatId, other.getUsername(), other.getAvatar())
                                            ))
                            );
                    return tx.transactional(work);
                });
    }

    private static String privateKey(Long a, Long b) {
        long x = Math.min(a, b);
        long y = Math.max(a, b);
        return x + ":" + y;
    }

    public Mono<ChatOpenDTO> createGroup(String currentUsername, CreateGroupChatRequest req) {
        final String name = (req == null || req.name() == null) ? null : req.name().trim();
        if (!StringUtils.hasText(name)) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Назва групи обовʼязкова"));
        }

        List<String> raw = req.usernames() != null
                ? req.usernames().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toList()
                : List.of();

        Set<String> uniq = new LinkedHashSet<>(raw);
        uniq.add(currentUsername);

        if (uniq.size() != raw.size() + 1) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ви намагаєтесь додати однакових користувачів (або додали себе у список)."
            ));
        }

        if (uniq.size() < 3) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "У групі має бути щонайменше 3 учасники"));
        }

        Mono<ChatOpenDTO> work = Flux.fromIterable(uniq)
                .flatMap(userRepository::findByUsername)
                .collectList()
                .flatMap(users -> {
                    if (users.size() != uniq.size()) {
                        return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Деяких користувачів не знайдено"));
                    }

                    return chatRepository.insertGroupReturnId(name)

                            .flatMap(chatId ->
                                    Flux.fromIterable(users)
                                            .flatMap(u -> chatRepository.addParticipant(chatId, u.getId()))
                                            .then(Mono.just(chatId))
                            )

                            .flatMap(chatId ->
                                    Flux.fromIterable(uniq)
                                            .flatMap(username ->
                                                    chatRepository.findChatViewForUserById(chatId, username)
                                                            .flatMap(view -> events.userChatPreview(username, view))
                                            )
                                            .then(Mono.just(new ChatOpenDTO(chatId, null, null)))
                            );
                });

        return tx.transactional(work);
    }
}
