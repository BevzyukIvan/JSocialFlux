package io.github.bevzyuk.jsocialflux.domain.user;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("user_following")
@Data
@NoArgsConstructor
public class UserFollowing {

    @Column("follower_id")
    private Long followerId;

    @Column("followed_id")
    private Long followedId;
}
