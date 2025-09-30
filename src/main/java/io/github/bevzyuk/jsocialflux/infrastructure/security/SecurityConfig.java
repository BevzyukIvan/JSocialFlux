package io.github.bevzyuk.jsocialflux.infrastructure.security;

import io.github.bevzyuk.jsocialflux.application.service.UserService;
import io.github.bevzyuk.jsocialflux.domain.user.Role;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.persistence.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                         JwtAuthenticationFilter jwtAuthenticationFilter) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)

                .exceptionHandling(e -> e
                        .authenticationEntryPoint((exchange, ex) ->
                                Mono.fromRunnable(() -> {
                                    var res = exchange.getResponse();
                                    res.getHeaders().remove("WWW-Authenticate");
                                    res.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                                }))
                        .accessDeniedHandler((exchange, ex) ->
                                Mono.fromRunnable(() -> {
                                    var res = exchange.getResponse();
                                    res.getHeaders().remove("WWW-Authenticate");
                                    res.setStatusCode(org.springframework.http.HttpStatus.FORBIDDEN);
                                }))
                )
                .authorizeExchange(ex -> ex
                        .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/api/auth/**", "/api/feed").permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/search"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/users/{username}"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/users/{username}/photos",
                                "/api/users/{username}/posts"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/users/{username}/followers",
                                "/api/users/{username}/following"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/photos/{id}",
                                "/api/posts/{id}"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/photos/{id}/comments",
                                "/api/posts/{id}/comments"
                        ).permitAll()
                        .pathMatchers("/ws/**").authenticated()
                        .anyExchange().authenticated()
                )
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @Bean
    public ReactiveAuthenticationManager authenticationManager(ReactiveUserDetailsService uds,
                                                               PasswordEncoder encoder) {
        UserDetailsRepositoryReactiveAuthenticationManager authManager = new UserDetailsRepositoryReactiveAuthenticationManager(uds);
        authManager.setPasswordEncoder(encoder);
        return authManager;
    }

    @Bean
    public ReactiveUserDetailsService reactiveUserDetailsService(UserService userService) {
        return username -> userService.findByUsername(username)
                .switchIfEmpty(Mono.error(
                        new UsernameNotFoundException("User '%s' not found".formatted(username))))
                .cast(UserDetails.class);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner seedUsers(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            Flux.range(1, 50)
                    .map(i -> "user" + i)
                    .concatMap(username ->
                            users.existsByUsername(username)
                                    .flatMap(exists -> {
                                        if (exists) return Mono.empty();
                                        User u = new User();
                                        u.setUsername(username);
                                        u.setPassword(encoder.encode("password"));
                                         u.setRole(Role.ROLE_USER);
                                         u.setAvatar(null);
                                        return users.save(u);
                                    })
                                    .onErrorResume(org.springframework.dao.DataIntegrityViolationException.class, e -> Mono.empty())
                    )
                    .then()
                    .subscribe();
        };
    }
}

