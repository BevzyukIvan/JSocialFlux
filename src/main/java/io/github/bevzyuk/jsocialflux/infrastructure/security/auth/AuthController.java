package io.github.bevzyuk.jsocialflux.infrastructure.security.auth;

import io.github.bevzyuk.jsocialflux.domain.user.Role;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import io.github.bevzyuk.jsocialflux.infrastructure.security.JwtTokenProvider;
import io.github.bevzyuk.jsocialflux.application.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ReactiveAuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public AuthController(ReactiveAuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          PasswordEncoder passwordEncoder,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<JwtResponse>> login(@RequestBody LoginRequest request,
                                                   ServerWebExchange exchange) {
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword());
        System.out.println("Ти потрапив в login контролер");

        return authenticationManager.authenticate(authToken)
                .map(authentication -> {
                    String jwt = tokenProvider.generateToken((UserDetails) authentication.getPrincipal());

                    boolean secure = "https".equalsIgnoreCase(exchange.getRequest().getURI().getScheme());
                    ResponseCookie cookie = buildJwtCookie(jwt, secure, Duration.ofDays(7));

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, cookie.toString())
                            .body(JwtResponse.success(jwt));
                })
                .onErrorResume(ex -> Mono.just(ResponseEntity
                        .status(401)
                        .body(JwtResponse.error("Невірний логін або пароль"))));
    }


    @PostMapping("/register")
    public Mono<ResponseEntity<JwtResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                      ServerWebExchange exchange) {
        return userService.findByUsername(request.getUsername())
                .map(u -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(JwtResponse.error("Користувач уже існує")))
                .switchIfEmpty(Mono.defer(() ->
                        userService.save(request.toUser(passwordEncoder))
                                .map(saved -> {
                                    String jwt = tokenProvider.generateToken(saved);
                                    boolean secure = "https".equalsIgnoreCase(exchange.getRequest().getURI().getScheme());
                                    ResponseCookie cookie = buildJwtCookie(jwt, secure, Duration.ofDays(7));

                                    return ResponseEntity.status(HttpStatus.CREATED)
                                            .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                            .body(JwtResponse.success(jwt));
                                })
                ));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Void>> logout(ServerWebExchange exchange) {
        boolean secure = "https".equalsIgnoreCase(exchange.getRequest().getURI().getScheme());
        ResponseCookie delete = buildJwtCookie("", secure, Duration.ZERO);
        return Mono.just(ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, delete.toString())
                .build());
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<CurrentUserDTO>> me(@AuthenticationPrincipal Mono<User> principal) {
        if (principal == null) return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        return principal
                .map(u -> ResponseEntity.ok(new CurrentUserDTO(u.getUsername(), u.getAvatar(), u.getRole())))
                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()));
    }

    public record CurrentUserDTO(String username, String avatar, Role role) {}

    private static ResponseCookie buildJwtCookie(String value, boolean secure, Duration maxAge) {
        return ResponseCookie.from("jwtToken", value == null ? "" : value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
