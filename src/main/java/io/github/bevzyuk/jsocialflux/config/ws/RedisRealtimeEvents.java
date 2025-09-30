package io.github.bevzyuk.jsocialflux.config.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatViewDTO;
import io.github.bevzyuk.jsocialflux.web.dto.message.MessageDeletedEvent;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
class RedisRealtimeEvents implements RealtimeEvents {
    private final ReactiveStringRedisTemplate redis;
    private final ObjectMapper om;

    private static String chChat(long id)           { return "chat:" + id; }
    private static String chUserPreview(String u)   {
        return "user:" + u + ":preview"; }

    @Override
    public Mono<Void> chatMessage(Long chatId, MessageDTO dto) {
        return Mono.fromCallable(() -> om.writeValueAsString(dto))
                .flatMap(json -> redis.convertAndSend(chChat(chatId), json).then());
    }

    @Override
    public Mono<Void> chatMessageDeleted(Long chatId, Long messageId) {
        var ev = new MessageDeletedEvent(messageId, chatId);
        return Mono.fromCallable(() -> om.writeValueAsString(ev))
                .flatMap(json -> redis.convertAndSend(chChat(chatId), json).then());
    }

    @Override
    public Mono<Void> userChatPreview(String username, ChatViewDTO view) {
        return Mono.fromCallable(() -> om.writeValueAsString(view))
                .flatMap(json -> redis.convertAndSend(chUserPreview(username), json).then());
    }
}

