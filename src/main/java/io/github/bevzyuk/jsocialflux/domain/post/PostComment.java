package io.github.bevzyuk.jsocialflux.domain.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("post_comment")
@Getter
@Setter
@NoArgsConstructor
public class PostComment {

    @Id
    private Long id;

    @NotBlank
    @Size(max = 1000)
    private String content;

    @Column("user_id")
    private Long userId;

    @Column("post_id")
    private Long postId;

    @CreatedDate
    private Instant createdAt;
}


