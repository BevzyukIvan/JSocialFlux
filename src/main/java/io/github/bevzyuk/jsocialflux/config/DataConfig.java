package io.github.bevzyuk.jsocialflux.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.EnableR2dbcAuditing;

@Configuration
@EnableR2dbcAuditing(modifyOnCreate = false)
public class DataConfig {
}

