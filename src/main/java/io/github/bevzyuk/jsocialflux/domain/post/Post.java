package io.github.bevzyuk.jsocialflux.domain.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("post")
@Getter
@Setter
@NoArgsConstructor
public class Post {

    @Id
    private Long id;

    @NotBlank
    @Size(max = 1000)
    private String content;

    @CreatedDate
    private Instant  createdAt;

    @LastModifiedDate
    private Instant editedAt;         // оновлюється автоматично

    @Column("user_id")
    private Long userId;                    // FK → users.id

    public boolean isEdited() { return editedAt != null; }
}

