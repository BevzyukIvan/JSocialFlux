package io.github.bevzyuk.jsocialflux.infrastructure.security.auth;

public record JwtResponse(String token, String error) {
    public static JwtResponse success(String token) {
        return new JwtResponse(token, null);
    }
    public static JwtResponse error(String message) {
        return new JwtResponse(null, message);
    }
}
