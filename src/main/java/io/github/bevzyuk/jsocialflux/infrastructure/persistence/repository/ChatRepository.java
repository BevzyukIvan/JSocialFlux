package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.domain.chat.Chat;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatViewDTO;
import io.github.bevzyuk.jsocialflux.web.mapper.column.UserLiteRec;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import io.github.bevzyuk.jsocialflux.web.mapper.column.ChatMetaRec;

import java.time.Instant;

public interface ChatRepository extends ReactiveCrudRepository<Chat, Long> {

    @Query("""
        SELECT
            c.id AS chat_id,
            CASE WHEN c.is_group THEN c.name ELSE other_u.username END AS display_name,
            CASE WHEN c.is_group THEN c.avatar ELSE other_u.avatar END   AS display_avatar,
            COALESCE(c.is_group, FALSE)                                  AS is_group,
            lm.content                                                   AS last_message,
            COALESCE(lm.sent_at, c.created_at)                           AS last_sent_at
        FROM chat c
        JOIN chat_participants cp ON cp.chat_id = c.id
        JOIN users me ON me.id = cp.user_id AND me.username = :currentUsername
        LEFT JOIN LATERAL (
            SELECT m.content, m.sent_at
            FROM message m
            WHERE m.chat_id = c.id
            ORDER BY m.sent_at DESC, m.id DESC
            LIMIT 1
        ) lm ON TRUE
        LEFT JOIN LATERAL (
            SELECT u.username, u.avatar
            FROM chat_participants cp2
            JOIN users u ON u.id = cp2.user_id
            WHERE cp2.chat_id = c.id AND u.username <> :currentUsername
            LIMIT 1
        ) other_u ON TRUE
    
        WHERE
            (c.is_group = TRUE OR lm.sent_at IS NOT NULL)
    
            AND (
                COALESCE(lm.sent_at, c.created_at) < :cursorTime
                OR (COALESCE(lm.sent_at, c.created_at) = :cursorTime AND c.id < :cursorId)
            )
    
        ORDER BY COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC
        LIMIT :limit
    """)
    Flux<ChatViewDTO> findChatViewsForUserSlice(String currentUsername, Instant cursorTime, Long cursorId, long limit);


    @Query("""
        INSERT INTO chat (name, is_group, avatar, private_key)
        VALUES (NULL, FALSE, NULL, :key)
        ON CONFLICT (private_key) DO NOTHING
        RETURNING id
        """)
    Mono<Long> insertPrivateIfAbsentReturnId(String key);

    @Query("SELECT id FROM chat WHERE private_key = :key AND is_group = FALSE LIMIT 1")
    Mono<Long> findPrivateChatIdByKey(String key);

    @Query("""
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (:chatId, :u1), (:chatId, :u2)
        ON CONFLICT DO NOTHING
        """)
    Mono<Void> addTwoParticipants(Long chatId, Long u1, Long u2);

    @Query("""
        INSERT INTO chat (name, is_group, avatar, private_key)
        VALUES (:name, TRUE, NULL, NULL)
        RETURNING id
        """)
    Mono<Long> insertGroupReturnId(String name);

    @Query("""
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (:chatId, :userId)
        ON CONFLICT DO NOTHING
        """)
    Mono<Void> addParticipant(Long chatId, Long userId);

    @Query("""
        SELECT
            c.id AS chat_id,
            CASE WHEN c.is_group THEN c.name ELSE other_u.username END AS display_name,
            CASE WHEN c.is_group THEN c.avatar ELSE other_u.avatar END AS display_avatar,
            COALESCE(c.is_group, FALSE) AS is_group,
            lm.content AS last_message,
            COALESCE(lm.sent_at, c.created_at) AS last_sent_at
        FROM chat c
        JOIN chat_participants cp ON cp.chat_id = c.id
        JOIN users me ON me.id = cp.user_id AND me.username = :currentUsername
        LEFT JOIN LATERAL (
            SELECT m.content, m.sent_at
            FROM message m
            WHERE m.chat_id = c.id
            ORDER BY m.sent_at DESC, m.id DESC
            LIMIT 1
        ) lm ON TRUE
        LEFT JOIN LATERAL (
            SELECT u.username, u.avatar
            FROM chat_participants cp2
            JOIN users u ON u.id = cp2.user_id
            WHERE cp2.chat_id = c.id AND u.username <> :currentUsername
            LIMIT 1
        ) other_u ON TRUE
        WHERE c.id = :chatId
    """)
    Mono<ChatViewDTO> findChatViewForUserById(Long chatId, String currentUsername);



    @Query("SELECT EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = :chatId AND user_id = :userId)")
    Mono<Boolean> isParticipant(Long chatId, Long userId);

    @Query("SELECT is_group AS is_group, name, avatar FROM chat WHERE id = :chatId")
    Mono<ChatMetaRec> findMeta(Long chatId);

    @Query("""
    SELECT u.id       AS id,
           u.username AS username,
           u.avatar   AS avatar
      FROM chat_participants cp
      JOIN users u ON u.id = cp.user_id
     WHERE cp.chat_id = :chatId AND u.id <> :currentUserId
     LIMIT 1
    """)
    Mono<UserLiteRec> findOtherParticipant(Long chatId, Long currentUserId);

    @Query("""
        SELECT u.username
          FROM chat_participants cp
          JOIN users u ON u.id = cp.user_id
         WHERE cp.chat_id = :chatId
        """)
    Flux<String> findParticipantUsernames(Long chatId);
}
