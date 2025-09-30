package io.github.bevzyuk.jsocialflux.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class FollowRepository {

    private final DatabaseClient client;


    public Mono<Long> insertFollow(Long followerId, Long followedId) {
        return client.sql("""
                INSERT INTO user_following (follower_id, followed_id)
                VALUES (:f, :t)
                ON CONFLICT DO NOTHING
                """)
                .bind("f", followerId)
                .bind("t", followedId)
                .fetch().rowsUpdated();
    }

    public Mono<Long> deleteFollow(Long followerId, Long followedId) {
        return client.sql("""
                DELETE FROM user_following
                 WHERE follower_id = :f AND followed_id = :t
                """)
                .bind("f", followerId)
                .bind("t", followedId)
                .fetch().rowsUpdated();
    }

    public Mono<Boolean> existsByFollowerAndFollowing(String followerUsername,
                                                      String followedUsername) {

        return client.sql("""
                SELECT EXISTS (
                    SELECT 1
                      FROM user_following f
                      JOIN users u1 ON u1.id = f.follower_id
                      JOIN users u2 ON u2.id = f.followed_id
                     WHERE u1.username = :follower
                       AND u2.username = :followed
                )
                """)
                .bind("follower", followerUsername)
                .bind("followed", followedUsername)
                .map(row -> row.get(0, Boolean.class))
                .one()
                .defaultIfEmpty(false);
    }
}
