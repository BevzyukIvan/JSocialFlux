package io.github.bevzyuk.jsocialflux.web.mapper;

import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatViewDTO;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class ChatPreviewMapper {

    private static final String DEFAULT_GROUP_NAME = "Група";

    public ChatViewDTO toPrivatePreviewForViewer(Long chatId,
                                                 String counterpartUsername,
                                                 String counterpartAvatar,
                                                 String lastMessage,
                                                 Instant lastSentAt) {
        return new ChatViewDTO(chatId, counterpartUsername, counterpartAvatar, false, lastMessage, lastSentAt);
    }

    public ChatViewDTO toGroupPreview(Long chatId,
                                      String groupName,
                                      String groupAvatar,
                                      String lastMessage,
                                      Instant lastSentAt) {
        String name = (groupName == null || groupName.isBlank()) ? DEFAULT_GROUP_NAME : groupName;
        return new ChatViewDTO(chatId, name, groupAvatar, true, lastMessage, lastSentAt);
    }
}

