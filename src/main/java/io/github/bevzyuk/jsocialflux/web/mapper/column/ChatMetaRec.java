package io.github.bevzyuk.jsocialflux.web.mapper.column;

import org.springframework.data.relational.core.mapping.Column;

public record ChatMetaRec(
        @Column("is_group") Boolean isGroup,
        @Column("name")     String  name,
        @Column("avatar")   String  avatar
) {}
