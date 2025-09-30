package io.github.bevzyuk.jsocialflux.domain.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("chat_participants")
@Data
@NoArgsConstructor
public class ChatParticipant {

    @Column("chat_id")
    private Long chatId;

    @Column("user_id")
    private Long userId;
}
