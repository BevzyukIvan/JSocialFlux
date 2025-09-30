package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.web.dto.feed.FeedItemRow;
import io.github.bevzyuk.jsocialflux.domain.post.Post;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.lang.Nullable;
import reactor.core.publisher.Flux;

import java.time.Instant;

public interface FeedRepository
        extends ReactiveCrudRepository<Post, Long> {

    @Query("""
        SELECT f.id,
               f.feed_type,
               f.username,
               f.avatar,
               f.content,
               f.image_url,
               f.created_at,
               f.edited
        FROM (
              SELECT p.id,
                     'POST'  AS feed_type,
                     2       AS feed_order,
                     u.username,
                     u.avatar,
                     p.content,
                     NULL     AS image_url,
                     p.created_at,
                     (p.edited_at IS NOT NULL) AS edited
                FROM post p
                JOIN users u ON u.id = p.user_id

              UNION ALL

              SELECT ph.id,
                     'PHOTO' AS feed_type,
                     1       AS feed_order,
                     u.username,
                     u.avatar,
                     ph.description AS content,
                     ph.url        AS image_url,
                     ph.uploaded_at AS created_at,
                     FALSE         AS edited
                FROM photo ph
                JOIN users u ON u.id = ph.user_id
        ) f
        WHERE
              $1 IS NULL                                        
           OR  f.created_at <  $1                               
           OR (f.created_at =  $1 AND f.feed_order <  $2)        
           OR (f.created_at =  $1 AND f.feed_order = $2 AND f.id < $3)  
        ORDER BY f.created_at DESC, f.feed_order DESC, f.id DESC
        LIMIT  $4
        """)
    Flux<FeedItemRow> findPage(@Nullable Instant cursorTs,
                               @Nullable Integer cursorOrder,
                               @Nullable Long cursorId,
                               int limit);


}
