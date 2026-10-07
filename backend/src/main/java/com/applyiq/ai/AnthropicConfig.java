package com.applyiq.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * No Anthropic SDK dependency — Spring's built-in RestClient (already on the
 * classpath via spring-boot-starter-webmvc) is enough for the single
 * POST /v1/messages call this module makes, mirroring the S3Config pattern:
 * a @Configuration class producing a pre-configured client bean.
 */
@Configuration
public class AnthropicConfig {

    @Value("${app.anthropic.base-url}")
    private String baseUrl;

    @Value("${app.anthropic.api-key}")
    private String apiKey;

    @Bean
    public RestClient anthropicRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("content-type", "application/json")
                .build();
    }
}
