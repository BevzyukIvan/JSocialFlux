package io.github.bevzyuk.jsocialflux.domain.user;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.*;

@Table("users")
@Data @NoArgsConstructor
public class User implements UserDetails {

    @Id
    private Long id;

    @NotBlank
    @Column("username")
    private String username;

    @NotBlank
    private String password;

    @Column("role")
    private Role role;

    private String avatar;

//    @CreatedDate
//    private Instant registeredAt;

    @Column("followers_cnt")
    Long followersCnt;

    @Column("following_cnt")
    Long followingCnt;

    @Transient
    private Set<Long> followingIds = new HashSet<>();

    @Transient
    private Set<Long> followerIds = new HashSet<>();

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return Collections.singleton(role); }
    @Override public boolean isAccountNonExpired()  { return true; }
    @Override public boolean isAccountNonLocked()   { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()            { return true; }

    public User(String username, String password, Role role) {
        this.username = username;
        this.password = password;
        this.role     = role;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User u)) return false;
        return Objects.equals(id, u.id) && Objects.equals(username, u.username);
    }
    @Override public int hashCode() { return Objects.hash(id, username); }
}