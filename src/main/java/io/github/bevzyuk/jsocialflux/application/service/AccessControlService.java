package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.domain.user.Role;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.ChatRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AccessControlService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;

    public boolean canEditUser(User target, User current) {
        return current != null &&
                (target.getUsername().equals(current.getUsername()) ||
                        isAdmin(current));
    }

    private boolean isAdmin(User u) {
        return u.getRole() == Role.ROLE_ADMIN;
    }

    public Mono<Void> assertOwnerOrAdmin(Long ownerUserId, String currentUsername) {
        return userRepository.findByUsername(currentUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(u -> {
                    boolean allowed = u.getRole() == Role.ROLE_ADMIN || u.getId().equals(ownerUserId);
                    return allowed ? Mono.empty()
                            : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ заборонено"));
                });
    }

    public Mono<Void> assertUserPreviewOwner(String currentUsername, String previewOwner) {
        return currentUsername.equals(previewOwner)
                ? Mono.empty()
                : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ заборонено"));
    }

    public Mono<Void> assertChatParticipant(Long chatId, String currentUsername) {
        return userRepository.findByUsername(currentUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(u -> chatRepository.isParticipant(chatId, u.getId())
                        .flatMap(ok -> ok ? Mono.empty()
                                : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Ви не учасник цього чату"))));
    }

    public Mono<Void> assertCanSubscribeChannel(String currentUsername, String channel) {
        if (channel.startsWith("chat:")) {
            Long chatId = Long.parseLong(channel.substring("chat:".length()));
            return assertChatParticipant(chatId, currentUsername);
        }
        if (channel.startsWith("user:") && channel.endsWith(":preview")) {
            String owner = channel.substring("user:".length(), channel.length() - ":preview".length());
            return assertUserPreviewOwner(currentUsername, owner);
        }

        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Невідомий канал"));
    }
}

