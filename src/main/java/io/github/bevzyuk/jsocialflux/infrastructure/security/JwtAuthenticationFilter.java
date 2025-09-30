package io.github.bevzyuk.jsocialflux.infrastructure.security;

import io.github.bevzyuk.jsocialflux.application.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;


    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        String token = extractToken(request);

        if (token == null) {
            // Немає токена — пропускаємо далі, щоб /api/auth/** та інші публічні працювали,
            // а для /ws принципал залишиться null і доступ вирішить Security/handler.
            return chain.filter(exchange);
        }

        if (!jwtTokenProvider.validateToken(token)) {
            // Видаляємо куку, але відповідь 401 має сенс тільки для HTTP-запитів,
            // у WS-handshake це виглядає як "closed before established" — ок.
            ResponseCookie deleteCookie = ResponseCookie.from("jwtToken", "")
                    .httpOnly(true)
                    .secure(exchange.getRequest().getURI().getScheme().equalsIgnoreCase("https"))
                    .sameSite("Strict")
                    .path("/")
                    .maxAge(Duration.ZERO)
                    .build();
            exchange.getResponse().addCookie(deleteCookie);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        long userId = jwtTokenProvider.getUserIdFromToken(token);

        return userService.findById(userId)
                .flatMap(userDetails -> {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    return chain.filter(exchange)
                            .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
                })
                .onErrorResume(UsernameNotFoundException.class, ex -> {
                    ResponseCookie deleteCookie = ResponseCookie.from("jwtToken", "")
                            .httpOnly(true)
                            .secure(exchange.getRequest().getURI().getScheme().equalsIgnoreCase("https"))
                            .sameSite("Strict")
                            .path("/")
                            .maxAge(Duration.ZERO)
                            .build();

                    exchange.getResponse().addCookie(deleteCookie);
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                });

    }

    private String extractToken(ServerHttpRequest request) {
        HttpCookie cookie = request.getCookies().getFirst("jwtToken");
        if (cookie != null) {
            return cookie.getValue();
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}

