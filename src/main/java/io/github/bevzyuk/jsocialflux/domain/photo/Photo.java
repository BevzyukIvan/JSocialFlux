package io.github.bevzyuk.jsocialflux.domain.photo;

import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("photo")
@Getter
@Setter
@NoArgsConstructor
public class Photo {

    @Id
    private Long id;                        // SERIAL PRIMARY KEY

    private String url;

    @CreatedDate
    private Instant uploadedAt;

    @Column("user_id")
    private Long userId;                    // FK → users.id

    @Size(max = 1000, message = "Опис не повинен перевищувати 1000 символів")
    private String description;
}


