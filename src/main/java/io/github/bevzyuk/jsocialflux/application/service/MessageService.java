package io.github.bevzyuk.jsocialflux.application.service;

import io.github.bevzyuk.jsocialflux.config.ws.RealtimeEvents;
import io.github.bevzyuk.jsocialflux.domain.chat.Message;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.ChatRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.MessageRepository;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatViewDTO;
import io.github.bevzyuk.jsocialflux.web.dto.message.MessageDeletedEvent;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageSlice;
import io.github.bevzyuk.jsocialflux.web.mapper.ChatPreviewMapper;
import io.github.bevzyuk.jsocialflux.web.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    private final MessageMapper messageMapper;
    private final ChatPreviewMapper chatPreviewMapper;
    private final RealtimeEvents events;

    public Mono<MessageDTO> sendToChat(Long chatId, String senderUsername, String rawContent) {
        final String content = (rawContent == null) ? null : rawContent.trim();
        if (!StringUtils.hasText(content)) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Повідомлення порожнє"));
        }
        if (content.length() > 255) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Макс 255 символів"));
        }

        return userRepository.findByUsername(senderUsername)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                .flatMap(sender ->
                        chatRepository.isParticipant(chatId, sender.getId())
                                .flatMap(ok -> ok ? Mono.just(sender)
                                        : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Ви не учасник цього чату")))
                                .flatMap(s -> chatRepository.findMeta(chatId)
                                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Чат не знайдено")))
                                        .flatMap(meta -> {

                                            Message m = new Message();
                                            m.setChatId(chatId);
                                            m.setSenderId(s.getId());
                                            m.setContent(content);

                                            return messageRepository.save(m)
                                                    .map(saved -> messageMapper.toDto(saved, s))

                                                    .flatMap(dto ->
                                                            events.chatMessage(chatId, dto)

                                                                    .then(Mono.defer(() -> {
                                                                        if (Boolean.TRUE.equals(meta.isGroup())) {
                                                                            ChatViewDTO preview = chatPreviewMapper.toGroupPreview(
                                                                                    chatId, meta.name(), meta.avatar(),
                                                                                    dto.content(), dto.sentAt()
                                                                            );
                                                                            return chatRepository.findParticipantUsernames(chatId)
                                                                                    .distinct()
                                                                                    .flatMap(u -> events.userChatPreview(u, preview))
                                                                                    .then();
                                                                        } else {
                                                                            return chatRepository.findOtherParticipant(chatId, s.getId())
                                                                                    .flatMap(other -> {
                                                                                        ChatViewDTO forSender = chatPreviewMapper.toPrivatePreviewForViewer(
                                                                                                chatId, other.username(), other.avatar(),
                                                                                                dto.content(), dto.sentAt()
                                                                                        );
                                                                                        ChatViewDTO forOther = chatPreviewMapper.toPrivatePreviewForViewer(
                                                                                                chatId, s.getUsername(), s.getAvatar(),
                                                                                                dto.content(), dto.sentAt()
                                                                                        );
                                                                                        return Flux.concat(
                                                                                                events.userChatPreview(s.getUsername(), forSender),
                                                                                                events.userChatPreview(other.username(), forOther)
                                                                                        ).then();
                                                                                    });
                                                                        }
                                                                    }))
                                                                    .thenReturn(dto)
                                                    );
                                        })
                                )
                );
    }


    public Mono<MessageSlice> listSlice(Long chatId, String username, Long cursorEpochMs, Long cursorId, int size) {
        int pageSize = Math.max(1, Math.min(size, 100));
        Instant cursorTime = (cursorEpochMs == null) ? Instant.now() : Instant.ofEpochMilli(cursorEpochMs);
        Long curId = (cursorId == null) ? Long.MAX_VALUE : cursorId;

        return userRepository.findByUsername(username)
                .flatMap(u -> chatRepository.isParticipant(chatId, u.getId())
                        .flatMap(ok -> ok ? Mono.just(u)
                                : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Ви не учасник цього чату"))))
                .thenMany(messageRepository.findSlice(chatId, cursorTime, curId, pageSize + 1))
                .collectList()
                .map(list -> {
                    boolean hasNext = list.size() > pageSize;
                    if (hasNext) list.remove(pageSize);

                    Long nextTime = hasNext ? list.get(list.size() - 1).sentAt().toEpochMilli() : null;
                    Long nextId   = hasNext ? list.get(list.size() - 1).id()                      : null;

                    return new MessageSlice(list, hasNext, nextTime, nextId);
                });
    }

    public Mono<Void> deleteMessage(Long messageId, String actorUsername) {
        return messageRepository.findById(messageId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Повідомлення не знайдено")))
                .flatMap(msg ->
                        userRepository.findByUsername(actorUsername)
                                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено")))
                                .flatMap(actor -> {
                                    boolean owner = msg.getSenderId() != null && actor.getId().equals(msg.getSenderId());
                                    boolean admin = "ROLE_ADMIN".equals(String.valueOf(actor.getRole()));
                                    if (!owner && !admin) {
                                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає прав"));
                                    }

                                    final Long chatId = msg.getChatId();

                                    return messageRepository.findLastId(chatId)
                                            .defaultIfEmpty(-1L)
                                            .flatMap(lastId ->

                                                    messageRepository.deleteById(messageId)

                                                            .then(events.chatMessageDeleted(chatId, messageId))

                                                            .then(Mono.defer(() -> {
                                                                if (!lastId.equals(messageId)) return Mono.empty();
                                                                return chatRepository.findParticipantUsernames(chatId)
                                                                        .distinct()
                                                                        .flatMap(username ->
                                                                                chatRepository.findChatViewForUserById(chatId, username)
                                                                                        .flatMap(view -> events.userChatPreview(username, view))
                                                                        )
                                                                        .then();
                                                            }))
                                            );
                                })
                );
    }
}
