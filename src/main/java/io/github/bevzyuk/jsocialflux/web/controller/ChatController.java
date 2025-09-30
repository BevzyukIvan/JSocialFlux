package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.ChatService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.AddParticipantsRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.CreateGroupChatRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.request.StartPrivateChatRequest;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatOpenDTO;
import io.github.bevzyuk.jsocialflux.web.dto.chat.response.ChatSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ChatSlice> myChats(@RequestParam(required = false) Long cursorEpochMs,
                                   @RequestParam(required = false) Long cursorId,
                                   @RequestParam(defaultValue = "20") int size,
                                   @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p ->
                chatService.listForUserSlice(p.getUsername(), cursorEpochMs, cursorId, size)
        );
    }

    @PostMapping(value = "/private", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ChatOpenDTO> startPrivate(@RequestBody StartPrivateChatRequest req,
                                          @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> chatService.startPrivate(p.getUsername(), req));
    }

    @PostMapping(value = "/group", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ChatOpenDTO> createGroup(@RequestBody CreateGroupChatRequest req,
                                         @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> chatService.createGroup(p.getUsername(), req));
    }
}
