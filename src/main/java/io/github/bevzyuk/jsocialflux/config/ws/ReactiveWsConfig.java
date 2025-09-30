package io.github.bevzyuk.jsocialflux.config.ws;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.HashMap;

@Configuration
class ReactiveWsConfig {

    @Bean
    HandlerMapping wsMapping(ChatWsHandler handler) {
        var map = new HashMap<String, WebSocketHandler>();
        map.put("/ws", handler);

        var m = new SimpleUrlHandlerMapping();
        m.setUrlMap(map);
        m.setOrder(-1);
        return m;
    }

    @Bean
    WebSocketHandlerAdapter wsAdapter() {
        return new WebSocketHandlerAdapter();
    }
}
