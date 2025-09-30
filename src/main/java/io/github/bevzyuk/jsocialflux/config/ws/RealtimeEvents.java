package io.github.bevzyuk.jsocialflux.config.ws;

import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatViewDTO;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import reactor.core.publisher.Mono;

public interface RealtimeEvents {
    Mono<Void> chatMessage(Long chatId, MessageDTO dto);
    Mono<Void> chatMessageDeleted(Long chatId, Long messageId);
    Mono<Void> userChatPreview(String username, ChatViewDTO view);
}
