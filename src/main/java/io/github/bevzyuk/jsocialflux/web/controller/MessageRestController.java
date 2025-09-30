package io.github.bevzyuk.jsocialflux.web.controller;

import io.github.bevzyuk.jsocialflux.application.service.MessageService;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.web.dto.message.request.SendMessageRequest;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageDTO;
import io.github.bevzyuk.jsocialflux.web.dto.message.response.MessageSlice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/chats/{chatId}/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<MessageSlice> list(@PathVariable Long chatId,
                                   @RequestParam(required = false) Long cursorEpochMs,
                                   @RequestParam(required = false) Long cursorId,
                                   @RequestParam(defaultValue = "30") int size,
                                   @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p ->
                messageService.listSlice(chatId, p.getUsername(), cursorEpochMs, cursorId, size));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<MessageDTO> create(@PathVariable Long chatId,
                                   @RequestBody SendMessageRequest req,
                                   @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p ->
                messageService.sendToChat(chatId, p.getUsername(), req.content()));
    }

    @DeleteMapping("/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long chatId,
                             @PathVariable Long messageId,
                             @AuthenticationPrincipal Mono<User> principal) {
        return principal.flatMap(p -> messageService.deleteMessage(messageId, p.getUsername()));
    }
}
