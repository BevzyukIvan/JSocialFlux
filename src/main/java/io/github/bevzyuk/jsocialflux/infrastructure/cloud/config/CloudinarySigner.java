package io.github.bevzyuk.jsocialflux.infrastructure.cloud.config;

import org.apache.commons.codec.digest.DigestUtils;

import java.util.Map;
import java.util.stream.Collectors;

public class CloudinarySigner {
    private final String apiSecret;
    public CloudinarySigner(String apiSecret) { this.apiSecret = apiSecret; }

    public String sign(Map<String, String> params) {
        String toSign = params.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
        return DigestUtils.sha1Hex(toSign + apiSecret);
    }
}

