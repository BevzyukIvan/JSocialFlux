package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostCardDTO;
import io.github.bevzyuk.jsocialflux.domain.post.Post;
import io.github.bevzyuk.jsocialflux.web.dto.post.response.PostResponseDTO;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface PostRepository extends R2dbcRepository<Post, Long> {

    @Query("""
        SELECT p.id,
               p.content,
               p.created_at,
               (p.edited_at IS NOT NULL) AS edited
          FROM post p
          JOIN users u ON u.id = p.user_id
         WHERE u.username = :username
           AND (
                 p.created_at < :ts
                 OR (p.created_at = :ts AND p.id < :tieId)
               )
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT :limit
    """)
    Flux<PostCardDTO> findPageByOwnerBefore(String username, Instant ts, long tieId, long limit);

    @Query("""
        SELECT p.id,
               p.content,
               p.created_at                     AS created_at,
               (p.edited_at IS NOT NULL)        AS edited,
               u.username                       AS owner_username,
               u.avatar                         AS owner_avatar
          FROM post p
          JOIN users u ON u.id = p.user_id
         WHERE p.id = :id
        """)
    Mono<PostResponseDTO> findResponseById(Long id);

    @Query("""
        UPDATE post p
           SET content   = :content,
               edited_at = now()
          FROM users u
         WHERE p.id = :id
           AND u.id = p.user_id
        RETURNING p.id,
                  p.content,
                  p.created_at                  AS created_at,
                  (p.edited_at IS NOT NULL)     AS edited,
                  u.username                    AS owner_username,
                  u.avatar                      AS owner_avatar
        """)
    Mono<PostResponseDTO> updateContentReturningDto(Long id, String content);
}

