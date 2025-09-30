package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.domain.post.PostComment;
import io.github.bevzyuk.jsocialflux.web.dto.postComment.response.PostCommentDTO;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.time.Instant;

public interface PostCommentRepository extends ReactiveCrudRepository<PostComment, Long> {

    @Query("""
    SELECT c.id,
           c.content,
           c.created_at                  AS created_at,
           u.username                    AS author_username,
           u.avatar                      AS author_avatar
      FROM post_comment c
      JOIN users u ON u.id = c.user_id
     WHERE c.post_id = :postId
       AND ( :ts IS NULL
             OR c.created_at < :ts
             OR (c.created_at = :ts AND c.id < :tieId) )
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT :limit
    """)
    Flux<PostCommentDTO> findPageByPostIdBefore(Long postId, Instant ts, long tieId, long limit);
}
