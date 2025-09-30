package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.domain.chat.Message;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface MessageRepository extends ReactiveCrudRepository<Message, Long> {

    @Query("""
        SELECT m.id,
               m.chat_id    AS chat_id,
               m.content,
               m.sent_at    AS sent_at,
               u.username   AS sender_username,
               u.avatar     AS sender_avatar
          FROM message m
          JOIN users u ON u.id = m.sender_id
         WHERE m.chat_id = :chatId
           AND (m.sent_at < :cursorTime
                OR (m.sent_at = :cursorTime AND m.id < :cursorId))
         ORDER BY m.sent_at DESC, m.id DESC
         LIMIT :limit
        """)
    Flux<MessageDTO> findSlice(Long chatId, Instant cursorTime, Long cursorId, long limit);

    @Query("""
        SELECT m.id
          FROM message m
         WHERE m.chat_id = :chatId
         ORDER BY m.sent_at DESC, m.id DESC
         LIMIT 1
        """)
    Mono<Long> findLastId(Long chatId);
}