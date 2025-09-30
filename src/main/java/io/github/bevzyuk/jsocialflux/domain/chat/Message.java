package io.github.bevzyuk.jsocialflux.domain.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Table("message")
@Data
@NoArgsConstructor
public class Message {

    @Id
    private Long id;

    @Column("chat_id")
    private Long chatId;

    @Column("sender_id")
    private Long senderId;

    private String content;

    @CreatedDate
    private Instant sentAt;
}

