package io.github.bevzyuk.jsocialflux.web.mapper.column;

import org.springframework.data.relational.core.mapping.Column;

public record UserLiteRec(
        @Column("id") Long id,
        @Column("username") String username,
        @Column("avatar") String avatar
) {}
