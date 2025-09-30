package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoCardDTO;
import io.github.bevzyuk.jsocialflux.domain.photo.Photo;
import io.github.bevzyuk.jsocialflux.web.dto.photo.response.PhotoResponseDTO;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface PhotoRepository extends R2dbcRepository<Photo, Long> {

    @Query("""
        SELECT ph.id,
               ph.url,
               ph.uploaded_at,
               ph.description
          FROM photo ph
          JOIN users u ON u.id = ph.user_id
         WHERE u.username = :username
           AND (
                 ph.uploaded_at < :ts
                 OR (ph.uploaded_at = :ts AND ph.id < :tieId)
               )
         ORDER BY ph.uploaded_at DESC, ph.id DESC
         LIMIT :limit
    """)
    Flux<PhotoCardDTO> findPageByOwnerBefore(String username, Instant ts, long tieId, long limit);

    @Query("""
        SELECT ph.id,
               ph.url,
               ph.uploaded_at AS uploaded_at,
               ph.description,
               u.username      AS owner_username,
               u.avatar        AS owner_avatar
          FROM photo ph
          JOIN users u ON u.id = ph.user_id
         WHERE ph.id = :id
        """)
    Mono<PhotoResponseDTO> findResponseById(Long id);

    @Query("""
        UPDATE photo p
           SET description = :description
          FROM users u
         WHERE p.id = :id
           AND u.id = p.user_id
        RETURNING p.id,
                  p.url,
                  p.uploaded_at AS uploaded_at,
                  p.description,
                  u.username     AS owner_username,
                  u.avatar       AS owner_avatar
        """)
    Mono<PhotoResponseDTO> updateDescriptionReturningDto(Long id, String description);
}

