package io.github.bevzyuk.jsocialflux.infrastructure.security.auth;

import io.github.bevzyuk.jsocialflux.domain.user.Role;
import io.github.bevzyuk.jsocialflux.domain.user.User;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.security.crypto.password.PasswordEncoder;

@Data
public class RegisterRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    public User toUser(PasswordEncoder encoder) {
        return new User(
                username,
                encoder.encode(password),
                Role.ROLE_USER
        );
    }
}
