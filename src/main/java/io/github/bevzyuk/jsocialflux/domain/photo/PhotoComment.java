package io.github.bevzyuk.jsocialflux.domain.photo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("photo_comment")
@Getter
@Setter
@NoArgsConstructor
public class PhotoComment {

    @Id
    private Long id;

    @NotBlank
    @Size(max = 1000)
    private String content;

    @Column("user_id")
    private Long userId;                    // FK → users.id

    @Column("photo_id")
    private Long photoId;                   // FK → photo.id

    @CreatedDate
    private Instant createdAt;
}

