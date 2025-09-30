package io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository;

import io.github.bevzyuk.jsocialflux.web.dto.user.UserCardDTO;
import io.github.bevzyuk.jsocialflux.web.dto.user.UserStatsDTO;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveCrudRepository<User, Long> {
    @Query("SELECT * FROM users WHERE username = :username")
    Mono<User> findByUsername(String username);

    @Query("""
    SELECT u.id,
           u.username,
           u.avatar
      FROM users u
     WHERE (:query IS NULL OR u.username ILIKE ('%' || :query || '%'))
       AND (:cursor IS NULL OR u.id < :cursor)
     ORDER BY u.id DESC
     LIMIT :limit
    """)
    Flux<UserCardDTO> findUserUserCardDTOsByUsername(
            @Param("query") String query,
            @Param("cursor") Long cursor,
            @Param("limit") long limit
    );

    @Query("""
    SELECT u.username,
           u.avatar,
           u.followers_cnt,
           u.following_cnt
      FROM users u
     WHERE u.username = :username
    """)
    Mono<UserStatsDTO> fetchStats(String username);

    Mono<Boolean> existsByUsername(String username);

    @Query("""
    SELECT u.id, u.username, u.avatar
      FROM users base
      JOIN user_following f ON f.followed_id = base.id
      JOIN users u         ON u.id = f.follower_id
     WHERE base.username = :user
       AND (:q = '' OR u.username ILIKE ('%'||:q||'%'))
       AND (:cursor IS NULL OR u.id < :cursor)     -- pagination
     ORDER BY u.id DESC
     LIMIT :limit
    """)
    Flux<UserCardDTO> findFollowersSlice(@Param("user") String username,
                                         @Param("q")    String q,
                                         @Param("cursor") Long cursor,
                                         @Param("limit") long limit);

    @Query("""
    SELECT u.id, u.username, u.avatar
      FROM users base
      JOIN user_following f ON f.follower_id = base.id
      JOIN users u         ON u.id = f.followed_id
     WHERE base.username = :user
       AND (:q = '' OR u.username ILIKE ('%'||:q||'%'))
       AND (:cursor IS NULL OR u.id < :cursor)
     ORDER BY u.id DESC
     LIMIT :limit
    """)
    Flux<UserCardDTO> findFollowingSlice(String user, String q, Long cursor, long limit);

    @Query("""
    SELECT n.id, n.username, n.avatar
      FROM (
            SELECT u.id, u.username, u.avatar
              FROM users base
              JOIN user_following f ON f.followed_id = base.id
              JOIN users u         ON u.id = f.follower_id
             WHERE base.username = :user
               AND (:q = '' OR u.username ILIKE ('%'||:q||'%'))
            UNION
            SELECT u.id, u.username, u.avatar
              FROM users base
              JOIN user_following f ON f.follower_id = base.id
              JOIN users u         ON u.id = f.followed_id
             WHERE base.username = :user
               AND (:q = '' OR u.username ILIKE ('%'||:q||'%'))
      ) n
     WHERE (:cursor IS NULL OR n.id < :cursor)
     ORDER BY n.id DESC
     LIMIT :limit
    """)
    Flux<UserCardDTO> findNetworkSlice(@Param("user") String username,
                                       @Param("q")    String q,
                                       @Param("cursor") Long cursor,
                                       @Param("limit") long limit);

    @Query("""
    SELECT u.id,
           u.username,
           u.avatar
      FROM users u
     WHERE (:query IS NULL OR u.username ILIKE ('%' || :query || '%'))
       AND (:cursor IS NULL OR u.id < :cursor)
       AND (:exclude IS NULL OR u.username <> :exclude)
     ORDER BY u.id DESC
     LIMIT :limit
    """)
    Flux<UserCardDTO> findUserUserCardDTOsByUsernameExcluding(
            @Param("query") String query,
            @Param("cursor") Long cursor,
            @Param("limit") long limit,
            @Param("exclude") String excludeUsername
    );
}
