package io.github.bevzyuk.jsocialflux.web.mapper;

import io.github.bevzyuk.jsocialflux.domain.chat.Message;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    public MessageDTO toDto(Message m, User sender) {
        return new MessageDTO(
                m.getId(),
                m.getChatId(),
                m.getContent(),
                m.getSentAt(),
                sender.getUsername(),
                sender.getAvatar()
        );
    }
}
