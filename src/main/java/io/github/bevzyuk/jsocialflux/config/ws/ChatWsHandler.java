package io.github.bevzyuk.jsocialflux.config.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bevzyuk.jsocialflux.application.service.AccessControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.CloseStatus;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.security.Principal;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
class ChatWsHandler implements WebSocketHandler {

    private final ReactiveRedisMessageListenerContainer container;
    private final AccessControlService access;
    private final ObjectMapper om;

    static final class Cmd { public String type; public String channel; }

    private static final int MAX_CHANNELS_PER_SESSION = 64;
    private static final int BACKPRESSURE_BUFFER = 512;

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        Mono<String> usernameMono = session.getHandshakeInfo().getPrincipal()
                .map(Principal::getName)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Необхідна автентифікація")))
                .cache();

        Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer(BACKPRESSURE_BUFFER);

        Map<String, Disposable> subs = new ConcurrentHashMap<>();

        Mono<Void> commandsFlow = session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .flatMap(json -> parseCmd(json))
                .flatMap(cmd -> {
                    final String type = cmd.type == null ? "" : cmd.type.trim().toUpperCase();
                    final String channel = normalizeChannel(cmd.channel);

                    switch (type) {
                        case "SUB":
                            if (channel.isEmpty()) return Mono.empty();
                            if (subs.containsKey(channel)) return Mono.empty();

                            if (subs.size() >= MAX_CHANNELS_PER_SESSION) {
                                return session.close(CloseStatus.POLICY_VIOLATION).then();
                            }

                            return usernameMono
                                    .flatMap(u -> access.assertCanSubscribeChannel(u, channel))
                                    .then(Mono.fromSupplier(() -> {
                                        Disposable d = container.receive(ChannelTopic.of(channel))
                                                .map(ReactiveSubscription.Message::getMessage)
                                                .map(Objects::toString)
                                                .onBackpressureBuffer(BACKPRESSURE_BUFFER)
                                                .subscribe(msg -> {
                                                    sink.tryEmitNext(msg);
                                                });
                                        return d;
                                    }))
                                    .flatMap(d -> {
                                        Disposable prev = subs.putIfAbsent(channel, d);
                                        if (prev != null) {
                                            d.dispose();
                                            return Mono.empty();
                                        }
                                        return Mono.empty();
                                    })
                                    .onErrorResume(ResponseStatusException.class, ex ->
                                            session.close(CloseStatus.POLICY_VIOLATION).then());

                        case "UNSUB":
                            if (channel.isEmpty()) return Mono.empty();
                            Disposable d = subs.remove(channel);
                            if (d != null) d.dispose();
                            return Mono.empty();

                        case "PING":
                            sink.tryEmitNext("{\"event\":\"PONG\"}");
                            return Mono.empty();

                        default:
                            return Mono.empty();
                    }
                })
                .then();

        Flux<String> heartbeat = Flux.interval(Duration.ofSeconds(30))
                .map(t -> "{\"event\":\"KEEPALIVE\"}");

        Mono<Void> outboundFlow = session.send(
                Flux.merge(sink.asFlux(), heartbeat)
                        .map(session::textMessage)
        );

        return Mono.when(commandsFlow, outboundFlow)
                .doFinally(sig -> {
                    subs.values().forEach(Disposable::dispose);
                    subs.clear();
                    sink.tryEmitComplete();
                });
    }

    private Mono<Cmd> parseCmd(String json) {
        return Mono.fromCallable(() -> om.readValue(json, Cmd.class))
                .onErrorResume(e -> Mono.empty());
    }

    private String normalizeChannel(String ch) {
        if (ch == null) return "";
        String s = ch.trim();
        if (s.startsWith("chat:")) return s;
        if (s.startsWith("user:") && s.endsWith(":preview")) return s;
        return "";
    }
}