package io.github.bevzyuk.jsocialflux.domain.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("chat")
@Data
@NoArgsConstructor
public class Chat {

    @Id
    private Long id;

    private String name;
    private String avatar;

    @Column("is_group")
    private boolean group;

    @CreatedDate
    @Column("created_at")
    private Instant createdAt;
}


