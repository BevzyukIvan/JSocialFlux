package io.github.bevzyuk.jsocialflux.web.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCardDTO {
    private Long id;
    private String username;
    private String avatar;
}
